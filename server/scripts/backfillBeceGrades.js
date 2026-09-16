// ── backfillBeceGrades ──────────────────────────────────────────
// One-off script: every BECE Session/MockExam saved before the
// WASSCE/BECE grading split was computed on the WASSCE A1-F9 scale.
// This recalculates waecGrade/gradeLabel for existing BECE records
// using the correct 1-9 BECE scale.
//
// Usage: npm run grades:backfill-bece   (from server/)

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import mongoose from 'mongoose'
import Session  from '../src/models/Session.model.js'
import MockExam from '../src/models/MockExam.model.js'
import { calculateBECEGrade } from '../src/utils/marking.utils.js'

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
    // ── Sessions ─────────────────────────────────────────────────
    const sessions = await Session.find({ examType: 'BECE' })
    let sessionsUpdated = 0

    for (const session of sessions) {
      const { grade, label } = calculateBECEGrade(session.totalMarks, session.availableMarks)
      if (session.waecGrade !== grade) {
        session.waecGrade = grade
        await session.save({ validateBeforeSave: false })
        sessionsUpdated++
      }
    }

    console.log(`✅ Sessions checked: ${sessions.length}, updated: ${sessionsUpdated}`)

    // ── Mock exams (marked only — results are only populated then) ─
    const exams = await MockExam.find({ examType: 'BECE', status: 'marked' })
    let examsUpdated = 0

    for (const exam of exams) {
      const { grade, label } = calculateBECEGrade(exam.results.totalMarks, exam.results.availableMarks)
      if (exam.results.waecGrade !== grade || exam.results.gradeLabel !== label) {
        exam.results.waecGrade  = grade
        exam.results.gradeLabel = label
        await exam.save({ validateBeforeSave: false })
        examsUpdated++
      }
    }

    console.log(`✅ Mock exams checked: ${exams.length}, updated: ${examsUpdated}`)
    console.log('\n✅ BECE grade backfill complete\n')

  } finally {
    await mongoose.disconnect()
  }
}

run().catch(err => {
  console.error('\n❌ backfillBeceGrades failed:', err.message)
  process.exit(1)
})
