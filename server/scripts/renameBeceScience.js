// ── renameBeceScience ─────────────────────────────────────────
// One-off script: BECE's "Integrated Science" is now called "Science"
// under the new NaCCA JHS curriculum (WASSCE keeps "Integrated
// Science" — this only touches BECE-tagged records). Renames the
// subject on every collection that stores it, plus each affected
// student's `subjects` array, and drops any stale cached prediction
// under the old name (it was scored under the old label, so it
// should be regenerated, not migrated in place).
//
// Usage: npm run subjects:rename-bece-science   (from server/)

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import mongoose from 'mongoose'
import Question        from '../src/models/Question.model.js'
import MasteryProfile  from '../src/models/MasteryProfile.model.js'
import Session         from '../src/models/Session.model.js'
import MockExam        from '../src/models/MockExam.model.js'
import Prediction      from '../src/models/Prediction.model.js'
import User            from '../src/models/User.model.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI
const OLD_NAME = 'Integrated Science'
const NEW_NAME = 'Science'

if (!MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is missing from your .env file\n')
  process.exit(1)
}

const run = async () => {
  await mongoose.connect(MONGODB_URI, { dbName: 'eduprepai' })

  try {
    const questionResult = await Question.updateMany(
      { subject: OLD_NAME, examType: 'BECE' },
      { subject: NEW_NAME }
    )
    console.log(`✅ Questions renamed: ${questionResult.modifiedCount}`)

    const masteryResult = await MasteryProfile.updateMany(
      { subject: OLD_NAME, examType: 'BECE' },
      { subject: NEW_NAME }
    )
    console.log(`✅ Mastery profiles renamed: ${masteryResult.modifiedCount}`)

    const sessionResult = await Session.updateMany(
      { subject: OLD_NAME, examType: 'BECE' },
      { subject: NEW_NAME }
    )
    console.log(`✅ Sessions renamed: ${sessionResult.modifiedCount}`)

    const mockExamResult = await MockExam.updateMany(
      { subject: OLD_NAME, examType: 'BECE' },
      { subject: NEW_NAME }
    )
    console.log(`✅ Mock exams renamed: ${mockExamResult.modifiedCount}`)

    const userResult = await User.updateMany(
      { subjects: OLD_NAME, examType: 'BECE' },
      { $set: { 'subjects.$[elem]': NEW_NAME } },
      { arrayFilters: [{ elem: OLD_NAME }] }
    )
    console.log(`✅ Users updated: ${userResult.modifiedCount}`)

    const deletedPrediction = await Prediction.deleteOne({ subject: OLD_NAME, examType: 'BECE' })
    console.log(`✅ Stale cached predictions dropped: ${deletedPrediction.deletedCount}`)

    console.log(`\n✅ BECE "${OLD_NAME}" → "${NEW_NAME}" rename complete\n`)

  } finally {
    await mongoose.disconnect()
  }
}

run().catch(err => {
  console.error('\n❌ renameBeceScience failed:', err.message)
  process.exit(1)
})
