import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import mongoose from 'mongoose'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'eduprepai' })

const result = await mongoose.connection.collection('questions').deleteMany({})
console.log(`\n🗑️  Cleared ${result.deletedCount} questions from the bank\n`)

await mongoose.disconnect()