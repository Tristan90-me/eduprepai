import { generateAIJSON } from '../utils/aiService.js'
import Question from '../models/Question.model.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'
import { createRequire } from 'module'
const require   = createRequire(import.meta.url)
const pdfParse  = require('pdf-parse')

// ── POST /api/admin/generate-questions ─────────────────────────
// Gemini generates WAEC-style questions based on admin config.
// Returns a preview array — nothing is saved until admin approves.
export const generateQuestions = asyncHandler(async (req, res) => {
  const {
    subject,
    examType  = 'WASSCE',
    topic,
    subtopic  = '',
    year      = new Date().getFullYear(),
    difficulty = 3,
    type      = 'MCQ',
    count     = 5,         // how many questions to generate
    section,
  } = req.body

  // Validate count — keep AI calls manageable
  if (count < 1 || count > 20) {
    throw new AppError('Count must be between 1 and 20 questions per request', 400)
  }

  // ── Build section default based on type ─────────────────────
  const defaultSection = type === 'MCQ'        ? 'A'
                       : type === 'Structured' ? 'B'
                       : 'C'
  const resolvedSection = section || defaultSection

  // ── Difficulty label for the prompt ─────────────────────────
  const difficultyLabel = {
    1: 'Foundation — basic recall, simple definitions',
    2: 'Standard — straightforward application of concepts',
    3: 'Intermediate — multi-step problems, some analysis required',
    4: 'Advanced — complex application, evaluation, synthesis',
    5: 'Examiner — highest WAEC standard, sophisticated reasoning required',
  }[difficulty] || 'Intermediate'

  // ── Marks based on section ───────────────────────────────────
  const marksMap = { A: 1, B: 10, C: 20 }
  const marks    = marksMap[resolvedSection] || 1

  const systemPrompt = `You are a WAEC chief examiner with 20 years of experience 
setting ${examType} ${subject} examination papers in Ghana.
You write questions that exactly match the WAEC standard of setting — 
precise language, authentic Ghanaian context where relevant, 
correct mark allocations, and curriculum-aligned content.
Always respond with valid JSON only. No markdown. No explanation outside the JSON.`

  const prompt = buildGenerationPrompt({
    subject, examType, topic, subtopic, year,
    difficulty, difficultyLabel, type,
    section: resolvedSection, marks, count,
  })

  // ── Call AI ──────────────────────────────────────────────────
  const generated = await generateAIJSON(prompt, systemPrompt)

  // ── Validate AI returned an array ───────────────────────────
  if (!Array.isArray(generated)) {
    throw new AppError('AI returned unexpected format. Please try again.', 500)
  }

  // ── Tag each question with metadata ─────────────────────────
  // These are previews — isAIGenerated flag tells admin they need review
  const previews = generated.map((q, i) => ({
    ...q,
    subject,
    examType,
    topic,
    subtopic,
    year:       Number(year),
    difficulty: Number(difficulty),
    type,
    section:    resolvedSection,
    marks,
    isAIGenerated: true,
    previewId:  `preview_${Date.now()}_${i}`, // temp ID for frontend tracking
  }))

  res.json({
    success:  true,
    message:  `${previews.length} questions generated — review before saving`,
    count:    previews.length,
    previews,
  })
})

// ── POST /api/admin/approve-questions ──────────────────────────
// Admin reviewed the previews and approved a subset.
// This is the only place questions actually get saved to MongoDB.
export const approveQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('No questions provided for approval', 400)
  }

  // Strip frontend-only fields before saving
  const cleaned = questions.map(({ previewId, isAIGenerated, ...rest }) => ({
    ...rest,
    isAIGenerated: true,      // keep this flag in DB for tracking
    addedBy: req.user._id,
  }))

  const saved = await Question.insertMany(cleaned, { ordered: false })

  res.status(201).json({
    success: true,
    message: `${saved.length} questions saved to the question bank`,
    count:   saved.length,
  })
})

// ── POST /api/admin/extract-pdf ────────────────────────────────
// Receives a PDF buffer, extracts text, sends to AI for parsing.
// Returns structured question previews — same review flow as generation.
export const extractFromPDF = asyncHandler(async (req, res) => {
  // The PDF arrives as a base64 string from the frontend
  const { pdfBase64, subject, examType, year } = req.body

  if (!pdfBase64) throw new AppError('No PDF data received', 400)
  if (!subject)   throw new AppError('Subject is required', 400)

  // ── Decode base64 → Buffer ───────────────────────────────────
  const buffer = Buffer.from(pdfBase64, 'base64')

  // ── Extract raw text from PDF ────────────────────────────────
  let extractedText
  try {
    const pdfData = await pdfParse(buffer)
    extractedText = pdfData.text

    if (!extractedText || extractedText.trim().length < 50) {
      throw new AppError(
        'Could not extract readable text from this PDF. ' +
        'The file may be a scanned image. Try a text-based PDF.',
        400
      )
    }
  } catch (err) {
    if (err.statusCode) throw err  // re-throw AppErrors
    throw new AppError('PDF parsing failed: ' + err.message, 400)
  }

  // ── Truncate if too long for AI context ──────────────────────
  // Gemini 1.5 Flash handles ~1M tokens but we keep prompts lean
  const truncated = extractedText.length > 15000
    ? extractedText.slice(0, 15000) + '\n[...text truncated for processing...]'
    : extractedText

  const systemPrompt = `You are a WAEC examination paper parser.
You receive raw text extracted from a ${examType} past question paper and 
identify every question, structuring them into a clean JSON format.
Be thorough — extract ALL questions including sub-parts.
Always respond with valid JSON only. No markdown. No preamble.`

  const prompt = buildExtractionPrompt({
    text: truncated,
    subject,
    examType,
    year: year || 'unknown',
  })

  // ── Call AI ──────────────────────────────────────────────────
  const extracted = await generateAIJSON(prompt, systemPrompt)

  if (!Array.isArray(extracted)) {
    throw new AppError('AI could not identify questions in this PDF. Check the file format.', 500)
  }

  // ── Tag with metadata from admin's input ─────────────────────
  const previews = extracted.map((q, i) => ({
    ...q,
    subject:    subject,
    examType:   examType || 'WASSCE',
    year:       Number(year) || new Date().getFullYear(),
    isAIGenerated: false,    // these are real past questions, not generated
    isPDFExtracted: true,
    previewId:  `pdf_${Date.now()}_${i}`,
  }))

  res.json({
    success:       true,
    message:       `${previews.length} questions extracted — review before saving`,
    count:         previews.length,
    pageCount:     extractedText.length > 0 ? 'detected' : 'unknown',
    previews,
  })
})

// ── Prompt builders (kept separate for clarity) ───────────────

const buildGenerationPrompt = ({
  subject, examType, topic, subtopic, year,
  difficulty, difficultyLabel, type,
  section, marks, count,
}) => {
  const mcqInstructions = type === 'MCQ' ? `
Each question must have:
- "options": exactly 4 strings (the answer choices, no A/B/C/D labels — just the text)
- "correctOption": one of "A", "B", "C", or "D"
- "modelAnswer": empty string ""` : ''

  const structuredInstructions = type === 'Structured' ? `
Each question must have:
- "options": empty array []
- "correctOption": empty string ""
- "modelAnswer": a detailed marking guide listing the expected answer points
- "parts": array of sub-questions, e.g. [{"part":"a","text":"...","marks":3,"answer":"..."}]
  The parts marks should sum to ${marks} total marks.` : ''

  const essayInstructions = type === 'Essay' ? `
Each question must have:
- "options": empty array []
- "correctOption": empty string ""  
- "modelAnswer": a detailed marking guide with key points worth marks
- "parts": empty array []` : ''

  return `Generate exactly ${count} ${examType} ${subject} examination questions.

Specifications:
- Topic: ${topic}
- Subtopic: ${subtopic || 'general'}
- Year style: ${year} (questions should feel like they are from this era)
- Question type: ${type}
- Section: ${section} (${marks} mark${marks > 1 ? 's' : ''} per question)
- Difficulty: Level ${difficulty} — ${difficultyLabel}

WAEC standards to follow:
- Use precise, unambiguous language matching WAEC examiner style
- Include authentic Ghanaian context where appropriate
- Ensure questions test understanding, not just memorisation
- Questions must be answerable from the standard ${examType} ${subject} syllabus
${mcqInstructions}
${structuredInstructions}
${essayInstructions}

Return ONLY a JSON array with exactly ${count} objects, each matching this structure:
[
  {
    "questionText": "Full question text here",
    "options": [],
    "correctOption": "",
    "modelAnswer": "",
    "parts": [],
    "syllabusReference": "approximate WAEC syllabus section"
  }
]`
}

const buildExtractionPrompt = ({ text, subject, examType, year }) => `
Extract ALL questions from this ${examType} ${subject} past paper (${year}).

Raw text from PDF:
---
${text}
---

Instructions:
- Identify every question — MCQ, structured, and essay
- For MCQ: capture all 4 options and identify the correct answer if shown
- For structured: capture each part (a, b, c) with its mark allocation
- For essay: capture the full question and any guidance given
- Determine the difficulty level (1-5) based on complexity
- Assign the correct section: A (MCQ), B (Structured), C (Essay)
- Marks: Section A = 1, Section B = varies (check the paper), Section C = 20

Return ONLY a JSON array where each object matches this structure:
[
  {
    "questionText": "The full question text",
    "topic": "The WAEC topic this question belongs to",
    "subtopic": "More specific subtopic if identifiable",
    "type": "MCQ" or "Structured" or "Essay",
    "section": "A" or "B" or "C",
    "difficulty": 1-5 (your assessment),
    "marks": number,
    "options": ["option text", "option text", "option text", "option text"] or [],
    "correctOption": "A" or "B" or "C" or "D" or "",
    "modelAnswer": "marking guide or expected answer" or "",
    "parts": [] or [{"part":"a","text":"...","marks":2,"answer":"..."}],
    "syllabusReference": ""
  }
]`