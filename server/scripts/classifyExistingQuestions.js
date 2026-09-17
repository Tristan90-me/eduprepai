// ── classifyExistingQuestions ────────────────────────────────────
// One-off script: backfills `questionSource` on every Question
// document that predates the field.
//
// IMPORTANT — this differs from a naive "isAIGenerated ? practice :
// pastPaper" split. Verification during implementation found that
// `isAIGenerated`/`isPDFExtracted` were never actually declared on
// the Question schema until this change, so Mongoose's strict-mode
// schema was silently stripping them on every insert (including the
// PDF Extractor's approved questions, e.g. the BECE Computing
// 2024/2026 transcriptions) — most existing documents have neither
// field stored at all, regardless of their real origin.
//
// So this defaults EVERYTHING to 'pastPaper' first (matching current
// de-facto behaviour, where everything already counts toward
// predictions today), then narrows to 'practice' only for documents
// with a RELIABLE, positively-stored isAIGenerated: true — the
// fossil field still present on older documents inserted back when
// it genuinely was declared (seedQuestions.js/seedDemo.js's own
// separate local schema, and any older shared-model documents from
// before that field was dropped from the schema). This can never
// wrongly exclude real past papers that simply have no flag stored.
//
// Usage: npm run questions:classify-existing   (from server/)

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import mongoose from 'mongoose'
import Question   from '../src/models/Question.model.js'
import Prediction from '../src/models/Prediction.model.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is missing from your .env file\n')
  process.exit(1)
}

const run = async () => {
  await mongoose.connect(MONGODB_URI, { dbName: 'eduprepai' })

  try {
    // ── Step 1: default every unclassified document to pastPaper ──
    const defaulted = await Question.updateMany(
      { questionSource: { $exists: false } },
      { questionSource: 'pastPaper' }
    )
    console.log(`✅ Defaulted to 'pastPaper': ${defaulted.modifiedCount}`)

    // ── Step 2: narrow to 'practice' for reliably-flagged AI content ─
    // Find affected subject+examType pairs BEFORE updating, so cached
    // predictions for exactly those can be invalidated below.
    const toReclassify = await Question.find(
      { questionSource: 'pastPaper', isAIGenerated: true },
      { subject: 1, examType: 1 }
    ).lean()

    const reclassified = await Question.updateMany(
      { questionSource: 'pastPaper', isAIGenerated: true },
      { questionSource: 'practice' }
    )
    console.log(`✅ Reclassified to 'practice': ${reclassified.modifiedCount}`)

    // ── Step 3: drop stale cached predictions for affected subjects ──
    const affectedPairs = [...new Map(
      toReclassify.map(q => [`${q.subject}|${q.examType}`, { subject: q.subject, examType: q.examType }])
    ).values()]

    let predictionsCleared = 0
    for (const { subject, examType } of affectedPairs) {
      const result = await Prediction.deleteOne({ subject, examType })
      if (result.deletedCount > 0) {
        predictionsCleared++
        console.log(`   🗑️  Cleared stale prediction cache: ${subject} (${examType})`)
      }
    }
    console.log(`✅ Stale prediction caches cleared: ${predictionsCleared}`)

    console.log('\n✅ Question source classification complete\n')

  } finally {
    await mongoose.disconnect()
  }
}

run().catch(err => {
  console.error('\n❌ classifyExistingQuestions failed:', err.message)
  process.exit(1)
})
