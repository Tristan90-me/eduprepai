// ── Kuulchat BECE past-question scraper ─────────────────────────
// Fetches the Objective (MCQ) section of BECE past papers from
// kuulchat.com, parses it deterministically (question text, 4
// options, and the correct answer — read straight from the site's
// own `mark(id, correctLetter, ...)` JS calls, not AI-guessed),
// classifies each question's topic against our canonical BECE
// syllabus taxonomy in one batched AI call per page, and inserts
// everything as pending (isActive: false, pendingReview: true) —
// nothing reaches students until an admin approves it in the
// Review Queue.
//
// Scope: Objective/MCQ sections only. The Theory (essay/structured)
// sections on these pages use deeply nested, inconsistently-formatted
// HTML (sub-parts, tables, mixed numbering) that isn't reliably
// parseable with the same approach — left for a follow-up.
//
// Usage:
//   node scripts/scrapeKuulchat.js
//   node scripts/scrapeKuulchat.js --subjects="Mathematics,English Language" --years=2020-2026
//   node scripts/scrapeKuulchat.js --delay=6000   (ms between page fetches — be polite to the source site)
//
// Note: this content originates from a third-party site republishing
// WAEC past-exam material. Each inserted question records its
// sourceUrl for traceability.

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mongoose from 'mongoose'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is missing from your .env file\n')
  process.exit(1)
}

// Imported after dotenv.config() so aiService.js sees the API keys
const { generateAIJSON } = await import('../src/utils/aiService.js')
const { getCanonicalTopics, normalizeTopic } = await import('../src/utils/questionExtraction.utils.js')
const { default: Question } = await import('../src/models/Question.model.js')

// ── Our subject name -> kuulchat URL slug ───────────────────────
const SUBJECT_SLUGS = {
  'Mathematics':                 'mathematics',
  'English Language':            'english',
  'Science':                     'science',
  'Social Studies':              'social-studies',
  'Religious & Moral Education': 'religious-and-moral-education',
}

// Slugs that don't follow the `{slug}-{year}` pattern
const SLUG_OVERRIDES = {
  'social-studies-2021': 'socialstudies-2021',
}

const buildUrl = (slug, year) => {
  const suffix = year === 2026 ? `june-${year}` : `${year}`
  const candidate = `${slug}-${suffix}`
  const path = SLUG_OVERRIDES[candidate] || candidate
  return `https://kuulchat.com/bece/questions/${path}`
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── Parse CLI args (--key=value) ────────────────────────────────
const args = {}
process.argv.slice(2).forEach(arg => {
  const match = arg.match(/^--([^=]+)=(.*)$/)
  if (match) args[match[1]] = match[2]
})

// Questions that embed a diagram as an <img> (Venn diagrams, geometric
// figures, graphs) can't be rendered — the app has no way to display
// the image, and the question text alone ("In the diagram, find...")
// is meaningless without it. Detected before tags are stripped.
const containsImage = (html) => /<img[\s>]/i.test(html)

const cleanText = (html) => html
  .replace(/<sup>([\s\S]*?)<\/sup>/gi, '^$1')
  .replace(/<sub>([\s\S]*?)<\/sub>/gi, '_$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/GHâµ/g, 'GH₵')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#8217;|â€™/g, '’')
  .replace(/\s+/g, ' ')
  .replace(/ (\^|_)/g, '$1')
  .trim()

// Node's built-in fetch has no default timeout and can hang
// indefinitely on a stalled connection instead of erroring — wrap
// every request with an explicit timeout, and retry once on any
// failure (timeout, transient DNS/TLS blip) before giving up on it.
const fetchWithRetry = async (url, attempts = 2) => {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EduPrepAI-research-bot)' },
        signal: AbortSignal.timeout(15000),
      })
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await sleep(3000)
    }
  }
  throw lastErr
}

// ── Fetch + deterministically parse the Objective (MCQ) section ──
const fetchObjectiveQuestions = async (url) => {
  const res = await fetchWithRetry(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const objStart = html.indexOf('OBJECTIVE TEST')
  if (objStart === -1) throw new Error('No "OBJECTIVE TEST" section found on this page')

  const theoryIdx = html.indexOf('THEORY QUESTIONS')
  const objectiveHtml = theoryIdx > -1 ? html.slice(objStart, theoryIdx) : html.slice(objStart)

  // Each question block starts at its numbered label div
  const blocks = objectiveHtml.split('<div class="remain-inline" style="width:30px">').slice(1)

  const questions = []
  let skippedImages = 0
  for (const block of blocks) {
    const markMatch = block.match(/mark\('(\w+)','([a-d])'/)
    if (!markMatch) continue
    const correctOption = markMatch[2].toUpperCase()

    // Stop at the "Mark"/"Solution" buttons — everything after that is
    // the explanation panel, which we never want to scan for content.
    const buttonIdx = block.indexOf('<button')
    const questionPart = buttonIdx > -1 ? block.slice(0, buttonIdx) : block

    if (containsImage(questionPart)) { skippedImages++; continue }

    const qTextMatch = questionPart.match(/class="question-box remain-inline"[^>]*>\s*<p>([\s\S]*?)<\/p>/)
    if (!qTextMatch) continue
    const questionText = cleanText(qTextMatch[1])
    if (!questionText) continue

    const optionMatches = [...questionPart.matchAll(/width:calc\(100% - 74px\)">\s*<p>([\s\S]*?)<\/p>/g)]
    const options = optionMatches.slice(0, 4).map(m => cleanText(m[1]))
    if (options.length !== 4 || options.some(o => !o)) continue

    questions.push({ questionText, options, correctOption })
  }
  return { questions, skippedImages }
}

// ── Classify a whole page's questions against the canonical topic
// list in a single AI call (not one call per question) ───────────
const classifyTopics = async (questions, subject) => {
  const canonicalTopics = getCanonicalTopics(subject)
  if (!canonicalTopics) {
    return questions.map(q => ({ ...q, topic: 'General', topicNeedsReview: true }))
  }

  const prompt = `Classify each of these BECE ${subject} multiple-choice questions into the SINGLE closest matching topic from this exact list — do not invent new topic names:
${canonicalTopics.map(t => `"${t}"`).join(', ')}

Questions:
${questions.map((q, i) => `${i}: ${q.questionText}`).join('\n')}

Return ONLY a JSON array with exactly ${questions.length} entries, like:
[{"index":0,"topic":"exact topic name from the list"}]`

  const systemPrompt = 'You are a WAEC BECE curriculum expert. Respond with valid JSON only. No markdown, no preamble.'

  try {
    const result = await generateAIJSON(prompt, systemPrompt)
    return questions.map((q, i) => {
      const match = Array.isArray(result) ? result.find(r => r.index === i) : null
      const { topic, topicNeedsReview } = normalizeTopic(match?.topic || '', canonicalTopics)
      return { ...q, topic, topicNeedsReview }
    })
  } catch (err) {
    console.warn(`  Topic classification failed (${err.message}) — queuing with topic left blank for manual review`)
    return questions.map(q => ({ ...q, topic: 'Unclassified', topicNeedsReview: true }))
  }
}

// ── Main ──────────────────────────────────────────────────────────
const run = async () => {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB\n')

  const subjects = args.subjects
    ? args.subjects.split(',').map(s => s.trim())
    : Object.keys(SUBJECT_SLUGS)

  const [fromYear, toYear] = (args.years || '2020-2026').split('-').map(Number)
  const delay = Number(args.delay) || 4000

  const jobs = []
  for (const subject of subjects) {
    if (!SUBJECT_SLUGS[subject]) {
      console.warn(`Skipping unknown subject: "${subject}" (not in SUBJECT_SLUGS)`)
      continue
    }
    for (let year = fromYear; year <= toYear; year++) {
      jobs.push({ subject, year, url: buildUrl(SUBJECT_SLUGS[subject], year) })
    }
  }

  console.log(`${jobs.length} page(s) to fetch across ${subjects.length} subject(s), ${fromYear}-${toYear}\n`)

  const summary = { ok: 0, failed: 0, skipped: 0, questionsQueued: 0, needsReview: 0, skippedImages: 0 }

  for (const [i, job] of jobs.entries()) {
    const label = `[${i + 1}/${jobs.length}] ${job.subject} ${job.year}`

    // Resume support — skip a page already fetched in a previous run
    // (e.g. after a network blip killed the process partway through),
    // unless --force is passed to redo everything.
    if (!args.force) {
      const already = await Question.exists({ sourceUrl: job.url })
      if (already) {
        summary.skipped++
        console.log(`${label} — already in DB, skipping (use --force to redo)`)
        continue
      }
    }

    try {
      const { questions: raw, skippedImages } = await fetchObjectiveQuestions(job.url)
      if (raw.length === 0) throw new Error('Parsed 0 questions — page layout may differ from the expected template')
      summary.skippedImages += skippedImages

      const classified = await classifyTopics(raw, job.subject)

      const docs = classified.map(q => ({
        subject:          job.subject,
        examType:         'BECE',
        year:             job.year,
        topic:            q.topic,
        type:             'MCQ',
        difficulty:       3,
        marks:            1,
        section:          'A',
        questionText:     q.questionText,
        options:          q.options,
        correctOption:    q.correctOption,
        isAIGenerated:    false,
        isPDFExtracted:   false,
        questionSource:   'pastPaper',
        sourceUrl:        job.url,
        isActive:         false,
        pendingReview:    true,
        topicNeedsReview: q.topicNeedsReview,
      }))

      const inserted = await Question.insertMany(docs, { ordered: false })
      const flagged  = inserted.filter(d => d.topicNeedsReview).length

      summary.ok++
      summary.questionsQueued += inserted.length
      summary.needsReview     += flagged
      console.log(`${label} — ${inserted.length} question(s) queued${flagged ? ` (${flagged} need topic review)` : ''}${skippedImages ? ` (${skippedImages} skipped — diagram-based)` : ''}`)
    } catch (err) {
      summary.failed++
      console.error(`${label} — FAILED: ${err.message}`)
    }

    if (i < jobs.length - 1) await sleep(delay)
  }

  console.log(`
── Summary ──────────────────────────────
Pages fetched:        ${summary.ok} ok, ${summary.failed} failed, ${summary.skipped} already done
Questions queued:      ${summary.questionsQueued}
Flagged for review:    ${summary.needsReview} (topic didn't confidently match the syllabus list)
Skipped (diagrams):    ${summary.skippedImages} (embedded an image the app can't display)

Go to Admin Panel → Review Queue to approve them before they go live.
`)

  await mongoose.disconnect()
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
