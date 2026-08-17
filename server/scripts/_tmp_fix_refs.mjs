import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mongoose from 'mongoose'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const mapping = {
  'ICT': 'Computing',
  'Pre-Technical Skills': 'Career Technology',
  'Creative Arts': 'Creative Arts and Design',
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'eduprepai' })
const coll = mongoose.connection.db.collection('questions')

let total = 0
for (const [oldName, newName] of Object.entries(mapping)) {
  const docs = await coll.find({
    syllabusReference: { $regex: `— ${oldName}$|${oldName} —` },
  }).toArray()

  for (const d of docs) {
    if (d.syllabusReference.includes(oldName) && !d.syllabusReference.includes(newName)) {
      const newRef = d.syllabusReference.split(oldName).join(newName)
      await coll.updateOne({ _id: d._id }, { $set: { syllabusReference: newRef } })
      total++
    }
  }
  console.log(`${oldName} -> ${newName}: updated ${docs.length} syllabusReference values`)
}
console.log(`Total: ${total}`)

const remaining = await coll.countDocuments({
  syllabusReference: { $regex: /\bICT\b|Creative Arts(?! and Design)|Pre-Technical Skills/ },
})
console.log(`Remaining old wording: ${remaining}`)

await mongoose.disconnect()
