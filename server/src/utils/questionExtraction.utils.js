import { getCanonicalTopics } from '../data/beceCurriculum.js'
import { renderPdfPagesToImages, renderPageCropsAtHighRes } from './pdfImageRenderer.utils.js'
import { generateAIJSON, generateAIJSONWithImages } from './aiService.js'

export { getCanonicalTopics }

// Hard cap on pages rendered to images per extraction — a normal WAEC/BECE
// past paper is well under this; guards against an oversized upload
// generating an excessive number of image parts in one AI call.
const MAX_IMAGE_PAGES = 20

// ── Levenshtein distance (small, dependency-free) ───────────────
const levenshtein = (a, b) => {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// ── Snap an AI-produced topic label onto the canonical syllabus list ──
// Exact match (case-insensitive) passes straight through. A close
// misspelling/rewording snaps to its nearest canonical match. Anything
// too far off is left as-is but flagged so it surfaces for a manual
// look in the review queue instead of silently diverging from the
// syllabus taxonomy — which would fragment the prediction engine's
// per-topic frequency/gap signals across differently-worded labels.
export const normalizeTopic = (rawTopic, canonicalTopics) => {
  if (!canonicalTopics?.length || !rawTopic) {
    return { topic: rawTopic, topicNeedsReview: false }
  }

  const exact = canonicalTopics.find(t => t.toLowerCase() === rawTopic.toLowerCase())
  if (exact) return { topic: exact, topicNeedsReview: false }

  let best = null
  let bestDistance = Infinity
  for (const candidate of canonicalTopics) {
    const distance = levenshtein(rawTopic.toLowerCase(), candidate.toLowerCase())
    if (distance < bestDistance) { bestDistance = distance; best = candidate }
  }

  // Allow up to ~35% of the longer string's length to differ — catches
  // rewordings/typos without forcing unrelated topics to match.
  const threshold = Math.ceil(Math.max(rawTopic.length, best?.length || 0) * 0.35)
  if (best && bestDistance <= threshold) {
    return { topic: best, topicNeedsReview: false }
  }

  return { topic: rawTopic, topicNeedsReview: true }
}

// ── Run topic normalization across a batch of extracted questions ──
// No-op (topicNeedsReview: false for all) when the subject has no
// canonical topic list yet — falls back to free-form AI labelling.
export const normalizeExtractedTopics = (questions, subject) => {
  const canonicalTopics = getCanonicalTopics(subject)
  if (!canonicalTopics) {
    return questions.map(q => ({ ...q, topicNeedsReview: false }))
  }
  return questions.map(q => {
    const { topic, topicNeedsReview } = normalizeTopic(q.topic, canonicalTopics)
    return { ...q, topic, topicNeedsReview }
  })
}

// ── Extraction prompt builder ────────────────────────────────────
// Shared by the admin PDF-upload endpoint and the batch CLI tool so
// both extract with identical instructions.
export const buildExtractionPrompt = ({ text, subject, examType, year, canonicalTopics }) => {
  const topicInstruction = canonicalTopics?.length
    ? `- topic: choose the SINGLE closest match from this exact list of official ${subject} syllabus topics — do not invent new topic names:
  ${canonicalTopics.map(t => `"${t}"`).join(', ')}
  If a question spans more than one, pick the primary one and use "subtopic" for finer detail.`
    : `- topic: The WAEC/GES topic this question belongs to`

  return `
Extract ALL questions from this ${examType} ${subject} past paper (${year}).

Raw text from PDF:
---
${text}
---

You have also been given an image of each page of this paper, in page order
starting from page 1. Use them to read diagrams, graphs, maps, and figures
that the raw text above cannot capture, and to correctly transcribe any
question whose wording depends on one (e.g. "using the diagram above...",
a graph to read values from, a map to label, a circuit to analyse).

Instructions:
- Identify every question — MCQ, structured, and essay
- For MCQ: capture all 4 options and identify the correct answer if shown
- For structured/essay questions with sub-parts: capture ONE "parts" entry
  per LEAF sub-part, not per top-level part. If a part is further divided
  — e.g. (a)(i), (a)(ii), (b)(i), (b)(ii), (c)(i)-(iii) — use a dotted
  label combining them: "a.i", "a.ii", "b.i", "b.ii", "c.i", "c.ii", "c.iii".
  A part with no further sub-division just keeps its own letter: "a". Give
  each leaf entry ONLY its own mark allocation, not its parent part's total
  (e.g. if (a) is worth 4 marks split across (a)(i)=2 and (a)(ii)=2, record
  two entries of 2 marks each, not one entry of 4).
- For essay questions with no sub-parts: capture the full question and any
  guidance given, with an empty "parts" array
- Determine the difficulty level (1-5) based on complexity
- Assign the correct section: A (MCQ), B (Structured), C (Essay)
- Marks: Section A = 1, Section B = varies (check the paper), Section C = 20
- If a question's meaning depends on a diagram/graph/map/figure visible on
  one of the page images, set "hasImage": true and "imagePage" to that
  page's number (1-indexed, matching the order the images were given), and
  set "imageBoundingBox" to where the figure sits on that page — an object
  {"x":0-1, "y":0-1, "width":0-1, "height":0-1} as fractions of the page's
  full width/height (x/y = top-left corner). Estimate this tightly around
  just the diagram/figure itself, not the surrounding question text or the
  rest of the page. Otherwise set "hasImage": false, "imagePage": null,
  "imageBoundingBox": null.
${topicInstruction}

Return ONLY a JSON array where each object matches this structure:
[
  {
    "questionText": "The full question text",
    "topic": "...",
    "subtopic": "More specific subtopic if identifiable",
    "type": "MCQ" or "Structured" or "Essay",
    "section": "A" or "B" or "C",
    "difficulty": 1-5 (your assessment),
    "marks": number,
    "options": ["option text", "option text", "option text", "option text"] or [],
    "correctOption": "A" or "B" or "C" or "D" or "",
    "modelAnswer": "marking guide or expected answer" or "",
    "parts": [] or [{"part":"a.i","text":"...","marks":2,"answer":"..."}, {"part":"a.ii","text":"...","marks":2,"answer":"..."}],
    "syllabusReference": "",
    "hasImage": true or false,
    "imagePage": number or null,
    "imageBoundingBox": {"x":0.1,"y":0.3,"width":0.4,"height":0.25} or null
  }
]`
}

// ── Shared vision-based extraction core ──────────────────────────
// Given an already-validated text extraction plus the original PDF
// buffer, runs the AI extraction (with page images so it can see
// diagrams), crops each diagram-dependent question's own figure, and
// normalizes topics against the syllabus taxonomy. Returns the final
// questions array — callers still own their own PDF-parsing/validation
// prologue (the admin upload endpoint and the batch CLI script differ
// slightly there), and their own metadata tagging afterward (preview
// IDs vs. isActive/pendingReview flags), but this is the substantial,
// previously-duplicated middle: render → prompt → AI call → crop.
export const extractQuestionsWithVision = async ({ buffer, text, subject, examType, year }) => {
  const truncated = text.length > 15000
    ? text.slice(0, 15000) + '\n[...text truncated for processing...]'
    : text

  // scale 1.5 — plenty legible for both the AI and on-screen review, while
  // meaningfully cutting rendering time, AI upload size, and response
  // payload size versus scale 2 (roughly 44% fewer pixels per page).
  const pageImages = await renderPdfPagesToImages(buffer, { scale: 1.5, maxPages: MAX_IMAGE_PAGES })

  const systemPrompt = `You are a WAEC examination paper parser.
You receive raw text extracted from a ${examType} past question paper, plus
an image of each page, and identify every question, structuring them into
a clean JSON format.
Be thorough — extract ALL questions including sub-parts.
Always respond with valid JSON only. No markdown. No preamble.`

  const canonicalTopics = getCanonicalTopics(subject)
  const prompt = buildExtractionPrompt({
    text: truncated,
    subject,
    examType,
    year: year || 'unknown',
    canonicalTopics,
  })

  let extracted = pageImages.length > 0
    ? await generateAIJSONWithImages(prompt, systemPrompt, pageImages)
    : await generateAIJSON(prompt, systemPrompt)

  if (!Array.isArray(extracted)) {
    throw new Error('AI could not identify questions in this PDF. Check the file format.')
  }

  // ── Crop each diagram-dependent question's own figure ──────────
  // The AI already saw the whole page to answer "does this question
  // depend on a diagram" — now re-render just that page at a higher
  // resolution and crop to the bounding box it reported, so the
  // student sees a focused, sharp figure instead of a full, cluttered
  // page screenshot. renderPageCropsAtHighRes batches this: the PDF is
  // loaded once and each distinct page is rendered at high-res once,
  // sequentially, even when several questions crop from the same page —
  // doing this per-question and fully in parallel (the original
  // approach) made the server unresponsive/crash on real papers with
  // more than a few diagram questions.
  const cropRequests = extracted
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.hasImage && pageImages[Number(q.imagePage) - 1])
    .map(({ q, i }) => ({ key: i, pageNumber: Number(q.imagePage), boundingBox: q.imageBoundingBox }))

  const crops = await renderPageCropsAtHighRes(buffer, cropRequests)

  extracted = extracted.map((q, i) => {
    const pageIdx = Number(q.imagePage) - 1  // imagePage is 1-indexed
    if (!q.hasImage || !pageImages[pageIdx]) {
      return { ...q, hasImage: false, imagePage: null, imageData: '' }
    }

    const crop = crops.get(i)
    return {
      ...q,
      hasImage:  true,
      imagePage: Number(q.imagePage),
      // Fall back to the whole page (already rendered for the AI
      // pass) if the crop failed — never lose the image entirely.
      imageData: crop?.data || pageImages[pageIdx].data,
    }
  })

  return normalizeExtractedTopics(extracted, subject)
}
