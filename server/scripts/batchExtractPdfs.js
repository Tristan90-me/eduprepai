// ── Batch PDF question extractor ────────────────────────────────
// CLI version of the admin "PDF Extractor" — loops over a folder of
// past-paper PDFs, runs the same Gemini/Claude extraction + syllabus
// topic-normalization logic as the HTTP endpoint, and inserts the
// results straight into MongoDB as pending (isActive: false,
// pendingReview: true). Nothing is visible to students, and nothing
// is "approved" — an admin still has to review and approve every
// question from the Review Queue tab before it goes live.
//
// Usage:
//   node scripts/batchExtractPdfs.js --folder=./past-papers/bece-math --subject="Mathematics" --examType=BECE
//   node scripts/batchExtractPdfs.js --folder=./past-papers --manifest=./past-papers/manifest.json
//   node scripts/batchExtractPdfs.js --folder=./past-papers --subject="Mathematics" --examType=BECE --admin=admin@example.com --delay=6000
//
// Manifest format (optional — overrides --subject/--examType/--year
// per file, and is the only way to mix subjects/years in one folder):
//   [
//     { "file": "math-2023.pdf", "subject": "Mathematics", "examType": "BECE", "year": 2023 },
//     { "file": "science-2022.pdf", "subject": "Science", "examType": "BECE", "year": 2022 }
//   ]
//
// Without a manifest entry for a file, --subject/--examType are
// required, and --year falls back to a 4-digit number found in the
// filename (e.g. "Mathematics_2023.pdf") if --year isn't passed.

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join, basename, extname } from 'path'
import { readFileSync, readdirSync, existsSync } from 'fs'
import mongoose from 'mongoose'
import { PDFParse } from 'pdf-parse'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is missing from your .env file\n')
  process.exit(1)
}

// Imported after dotenv.config() so aiService.js sees the API keys
const { extractQuestionsWithVision } = await import('../src/utils/questionExtraction.utils.js')
const { default: Question } = await import('../src/models/Question.model.js')
const { default: User }     = await import('../src/models/User.model.js')

// ── Parse CLI args (--key=value, matches manageAdmin.js) ────────
const args = {}
process.argv.slice(2).forEach(arg => {
  const match = arg.match(/^--([^=]+)=(.*)$/)
  if (match) args[match[1]] = match[2]
})

const printUsage = () => {
  console.log(`
Usage:
  node scripts/batchExtractPdfs.js --folder=<dir> --subject="<subject>" --examType=<BECE|WASSCE> [--year=<yyyy>] [--admin=<email>] [--delay=<ms>]
  node scripts/batchExtractPdfs.js --folder=<dir> --manifest=<path.json> [--admin=<email>] [--delay=<ms>]
`)
}

if (!args.folder || !existsSync(args.folder)) {
  console.error('❌ --folder is required and must exist')
  printUsage()
  process.exit(1)
}

const DELAY_MS = Number(args.delay) || 5000 // ~12/min — stays under Gemini's free-tier 15/min cap

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── Resolve per-file metadata ────────────────────────────────────
let manifest = null
if (args.manifest) {
  if (!existsSync(args.manifest)) {
    console.error(`❌ Manifest not found: ${args.manifest}`)
    process.exit(1)
  }
  manifest = JSON.parse(readFileSync(args.manifest, 'utf-8'))
}

const resolveMeta = (filename) => {
  const entry = manifest?.find(m => m.file === filename)
  if (entry) {
    return { subject: entry.subject, examType: entry.examType || 'BECE', year: Number(entry.year) || undefined }
  }
  const yearMatch = filename.match(/\b(19|20)\d{2}\b/)
  return {
    subject:  args.subject,
    examType: args.examType || 'BECE',
    year:     args.year ? Number(args.year) : (yearMatch ? Number(yearMatch[0]) : undefined),
  }
}

// ── Extraction — shares extractQuestionsWithVision with the admin
// PDF Extractor's extractFromPDF (aiQuestions.controller.js), so this
// CLI now gets the same diagram-cropping and vision-based transcription
// instead of the old text-only pass. ──────────────────────────────
const extractFile = async (filePath, meta) => {
  const buffer = readFileSync(filePath)
  const parser = new PDFParse({ data: buffer })
  let text
  try {
    const result = await parser.getText()
    text = result.text
  } finally {
    await parser.destroy()
  }

  if (!text || text.trim().length < 50) {
    throw new Error('No readable text extracted — likely a scanned image PDF (needs OCR first)')
  }

  return extractQuestionsWithVision({
    buffer, text,
    subject:  meta.subject,
    examType: meta.examType,
    year:     meta.year,
  })
}

// ── Main ──────────────────────────────────────────────────────────
const run = async () => {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB\n')

  let addedBy
  if (args.admin) {
    const admin = await User.findOne({ email: args.admin.toLowerCase(), role: 'admin' })
    if (!admin) {
      console.error(`❌ No admin found with email ${args.admin}`)
      process.exit(1)
    }
    addedBy = admin._id
  }

  const files = readdirSync(args.folder).filter(f => extname(f).toLowerCase() === '.pdf')
  if (files.length === 0) {
    console.error(`❌ No PDF files found in ${args.folder}`)
    process.exit(1)
  }

  console.log(`Found ${files.length} PDF(s) in ${args.folder}\n`)

  const summary = { filesOk: 0, filesFailed: 0, questionsQueued: 0, needsReview: 0 }

  for (const [i, file] of files.entries()) {
    const meta = resolveMeta(file)
    const label = `[${i + 1}/${files.length}] ${file}`

    if (!meta.subject) {
      console.warn(`${label} — skipped: no subject (add a manifest entry or pass --subject)`)
      summary.filesFailed++
      continue
    }

    try {
      const questions = await extractFile(join(args.folder, file), meta)

      const docs = questions.map(q => ({
        ...q,
        subject:        meta.subject,
        examType:       meta.examType,
        year:           meta.year || new Date().getFullYear(),
        isAIGenerated:  false,
        isPDFExtracted: true,
        questionSource: 'pastPaper',
        isActive:       false,   // hidden from students
        pendingReview:  true,    // awaiting admin approval in the Review Queue
        addedBy,
      }))

      const inserted = await Question.insertMany(docs, { ordered: false })
      const flagged  = inserted.filter(d => d.topicNeedsReview).length

      summary.filesOk++
      summary.questionsQueued += inserted.length
      summary.needsReview     += flagged

      console.log(`${label} — ${inserted.length} question(s) queued${flagged ? ` (${flagged} need topic review)` : ''}`)
    } catch (err) {
      summary.filesFailed++
      console.error(`${label} — FAILED: ${err.message}`)
    }

    // Pace requests — one Gemini call per file, stay under free-tier rate limits
    if (i < files.length - 1) await sleep(DELAY_MS)
  }

  console.log(`
── Summary ──────────────────────────────
Files processed:      ${summary.filesOk} ok, ${summary.filesFailed} failed
Questions queued:     ${summary.questionsQueued}
Flagged for review:   ${summary.needsReview} (topic didn't confidently match the syllabus list)

Go to Admin Panel → Review Queue to approve them before they go live.
`)

  await mongoose.disconnect()
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
