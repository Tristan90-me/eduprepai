import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import mongoose from 'mongoose'
import User from '../src/models/User.model.js'

// ── Resolve .env path relative to this file ────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is missing from your .env file\n')
  process.exit(1)
}

// ── Parse CLI args ──────────────────────────────────────────────
// node scripts/manageAdmin.js create  --email=x@x.com --password=... --name="Jane Admin"
// node scripts/manageAdmin.js promote --email=x@x.com
const [, , command, ...rest] = process.argv

const args = {}
rest.forEach(arg => {
  const match = arg.match(/^--([^=]+)=(.*)$/)
  if (match) args[match[1]] = match[2]
})

const printUsage = () => {
  console.log(`
Usage:
  node scripts/manageAdmin.js create  --email=<email> --password=<password> --name="<full name>"
  node scripts/manageAdmin.js promote --email=<email>
`)
}

const run = async () => {
  if (!['create', 'promote'].includes(command)) {
    printUsage()
    process.exitCode = 1
    return
  }

  await mongoose.connect(MONGODB_URI, { dbName: 'eduprepai' })

  try {
    if (command === 'create') {
      const { email, password, name } = args
      if (!email || !password || !name) {
        console.error('\n❌ --email, --password and --name are all required\n')
        printUsage()
        process.exitCode = 1
        return
      }

      const existing = await User.findOne({ email })
      if (existing) {
        console.error(`\n❌ ${email} already exists — use "promote" instead\n`)
        process.exitCode = 1
        return
      }

      const user = await User.create({
        fullName: name,
        email,
        password,
        role: 'admin',
      })
      console.log(`\n✅ Admin account created: ${user.email} (${user._id})\n`)
      return
    }

    // command === 'promote'
    const { email } = args
    if (!email) {
      console.error('\n❌ --email is required\n')
      printUsage()
      process.exitCode = 1
      return
    }

    const user = await User.findOne({ email })
    if (!user) {
      console.error(`\n❌ No user found with email ${email}\n`)
      process.exitCode = 1
      return
    }

    if (user.role === 'admin') {
      console.log(`\nℹ️  ${email} is already an admin\n`)
      return
    }

    user.role = 'admin'
    await user.save({ validateBeforeSave: false })
    console.log(`\n✅ ${email} promoted to admin\n`)

  } finally {
    await mongoose.disconnect()
  }
}

run().catch(err => {
  console.error('\n❌ manageAdmin failed:', err.message)
  process.exit(1)
})
