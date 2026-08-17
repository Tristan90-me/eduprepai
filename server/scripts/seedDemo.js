import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import mongoose from 'mongoose'
import { GoogleGenAI } from '@google/genai'

// ── Resolve .env path relative to this file ────────────────────
// Works correctly regardless of which directory you run npm from.
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

// ── Validate required env vars before doing anything else ──────
const MONGODB_URI  = process.env.MONGODB_URI
const GEMINI_KEY   = process.env.GEMINI_API_KEY

if (!MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is missing from your .env file')
  console.error('   Make sure server/.env exists and contains MONGODB_URI=...\n')
  process.exit(1)
}

if (!GEMINI_KEY) {
  console.error('\n❌ GEMINI_API_KEY is missing from your .env file')
  console.error('   Make sure server/.env exists and contains GEMINI_API_KEY=...\n')
  process.exit(1)
}

import { CURRICULUM, YEARS } from './seedData.js'

// ── Initialise AI client AFTER dotenv has loaded ───────────────
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY })

const questionSchema = new mongoose.Schema({
  subject: String, examType: String, year: Number,
  topic: String, subtopic: String, syllabusReference: String,
  type: String, difficulty: Number, marks: Number, section: String,
  questionText: String, options: [String], correctOption: String,
  modelAnswer: String, explanation: String, parts: Array,
  isActive: { type: Boolean, default: true },
  isAIGenerated: { type: Boolean, default: true },
}, { timestamps: true })

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── Rate limit tracker ─────────────────────────────────────────
let reqCount = 0
let winStart  = Date.now()

const pace = async () => {
  reqCount++
  if (reqCount >= 12) {
    const wait = Math.max(0, 62000 - (Date.now() - winStart))
    if (wait > 0) {
      console.log(`\n⏳ Rate limit pause: ${Math.round(wait/1000)}s…`)
      await sleep(wait)
    }
    reqCount = 0
    winStart  = Date.now()
  }
}

// ── Math formatting instructions ───────────────────────────────
// These instructions ensure the AI writes math that students
// can read without a LaTeX renderer, while still being precise.
const MATH_INSTRUCTIONS = `
CRITICAL — Mathematical notation rules:
- Write fractions as: "3/4" or "(2x + 1)/(x - 3)" NOT as LaTeX like \\frac{}{}
- Write square roots as: "sqrt(5)" or "root(2)" NOT as \\sqrt{}
- Write powers as: "x^2" or "2^3" NOT as x^{2}
- Write multiplication as: "3 × 4" or "3 * 4" NOT as 3\\times4
- Write division as: "12 ÷ 4" NOT as \\div
- Write "greater than or equal to" as: ">=" or "≥" NOT as \\geq
- Write "pi" as: "π" NOT as \\pi
- For complex expressions use brackets clearly: "3sqrt(5) / (sqrt(5) - 2)"
- You MAY use $...$ LaTeX for complex display expressions ONLY if truly necessary
- Prefer readable plain text for ALL mathematical expressions
- Example good: "Find the value of x if (2x + 3)/5 = 7"
- Example bad:  "Find x if $\\frac{2x+3}{5} = 7$"
`

// ── Batch generator ────────────────────────────────────────────
const generateBatch = async (subject, examType, topic, subtopics, years) => {
  await pace()
  const questions = []

  const isNonMathSubject = ![
    'Mathematics', 'Elective Mathematics', 'Physics',
    'Chemistry', 'Biology',
  ].includes(subject)

  const mathNote = isNonMathSubject
    ? ''
    : MATH_INSTRUCTIONS

  const prompt = `You are a WAEC chief examiner for ${examType} ${subject} in Ghana.
Generate realistic past-paper-style questions for the topic "${topic}".

CONTEXT:
- Subject: ${subject}
- Exam type: ${examType}
- Topic: ${topic}
- Subtopics to cover: ${subtopics.join(', ')}
- Year range: ${years.join(', ')}
- Ghanaian context: Use Ghanaian names, places, currency (GHS), and real local examples

${mathNote}

Generate exactly:
- 15 MCQ questions distributed across the years ${years.slice(0,6).join(', ')}
- 3 Structured questions (10 marks each, with 3 sub-parts a, b, c)
- 2 Essay questions (20 marks each)

For MCQ: 4 options only, exactly one correct answer, plausible distractors
For Structured: realistic sub-parts with marks shown, detailed marking guide
For Essay: clear essay prompt, comprehensive marking criteria

Return a JSON object with this exact structure — no markdown, no explanation:
{
  "mcq": [
    {
      "year": 2019,
      "subtopic": "subtopic name",
      "difficulty": 3,
      "questionText": "Full question text in plain readable English",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctOption": "A"
    }
  ],
  "structured": [
    {
      "year": 2021,
      "subtopic": "subtopic name",
      "difficulty": 3,
      "questionText": "Main question text",
      "modelAnswer": "Detailed marking guide: (a) key points worth 4 marks, (b) key points worth 3 marks, (c) key points worth 3 marks",
      "parts": [
        {"part": "a", "text": "Part (a) question text", "marks": 4, "answer": "Expected answer for part a"},
        {"part": "b", "text": "Part (b) question text", "marks": 3, "answer": "Expected answer for part b"},
        {"part": "c", "text": "Part (c) question text", "marks": 3, "answer": "Expected answer for part c"}
      ]
    }
  ],
  "essay": [
    {
      "year": 2022,
      "subtopic": "subtopic name",
      "difficulty": 4,
      "questionText": "Essay question prompt",
      "modelAnswer": "Comprehensive marking guide covering content organisation language and analysis criteria"
    }
  ]
}`

  try {
    const response = await ai.models.generateContent({
      model:    'gemini-3.5-flash-lite',
      contents: prompt,
    })

    const raw = response.text
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim()

    const data = JSON.parse(cleaned)

    // ── Process MCQ ────────────────────────────────────────────
    ;(data.mcq || []).forEach(q => {
      if (!q.questionText || !q.options || q.options.length !== 4) return
      questions.push({
        subject, examType, topic,
        subtopic:          q.subtopic || subtopics[0],
        syllabusReference: `WAEC ${examType} ${subject} — ${topic}`,
        year:              Number(q.year) || 2020,
        type:              'MCQ',
        section:           'A',
        marks:             1,
        difficulty:        Number(q.difficulty) || 3,
        questionText:      q.questionText,
        options:           q.options,
        correctOption:     q.correctOption || 'A',
        modelAnswer:       '',
        parts:             [],
        isActive:          true,
        isAIGenerated:     true,
      })
    })

    // ── Process Structured ─────────────────────────────────────
    ;(data.structured || []).forEach(q => {
      if (!q.questionText) return
      questions.push({
        subject, examType, topic,
        subtopic:          q.subtopic || subtopics[0],
        syllabusReference: `WAEC ${examType} ${subject} — ${topic}`,
        year:              Number(q.year) || 2021,
        type:              'Structured',
        section:           'B',
        marks:             10,
        difficulty:        Number(q.difficulty) || 3,
        questionText:      q.questionText,
        options:           [],
        correctOption:     '',
        modelAnswer:       q.modelAnswer || '',
        parts:             q.parts || [],
        isActive:          true,
        isAIGenerated:     true,
      })
    })

    // ── Process Essay ──────────────────────────────────────────
    ;(data.essay || []).forEach(q => {
      if (!q.questionText) return
      questions.push({
        subject, examType, topic,
        subtopic:          q.subtopic || subtopics[0],
        syllabusReference: `WAEC ${examType} ${subject} — ${topic}`,
        year:              Number(q.year) || 2022,
        type:              'Essay',
        section:           'C',
        marks:             20,
        difficulty:        Number(q.difficulty) || 4,
        questionText:      q.questionText,
        options:           [],
        correctOption:     '',
        modelAnswer:       q.modelAnswer || '',
        parts:             [],
        isActive:          true,
        isAIGenerated:     true,
      })
    })

    return questions

  } catch (err) {
    console.error(`\n   ⚠️  Failed for ${subject}/${topic}: ${err.message?.slice(0, 120)}`)
    return []
  }
}

// ── Main ───────────────────────────────────────────────────────
const seedDemo = async () => {
  console.log('\n🌱 EduPrepAI — Full Question Bank Seeder')
  console.log('   All WASSCE and BECE subjects · All official topics')
  console.log('━'.repeat(58))

 await mongoose.connect(MONGODB_URI, { dbName: 'eduprepai' })
  console.log('✅ Connected to MongoDB\n')

  const Question = mongoose.models.Question ||
    mongoose.model('Question', questionSchema)

  const existingCount = await Question.countDocuments()
  console.log(`📊 Current question bank: ${existingCount} questions`)

  if (existingCount > 300 && !process.argv.includes('--force')) {
    console.log('\n⚠️  Bank already has 300+ questions.')
    console.log('   Run with --force to add more:')
    console.log('   node scripts/seedDemo.js --force')
    await mongoose.disconnect()
    return
  }

  let totalInserted  = 0
  let totalFailed    = 0
  const subjectStats = {}

  const allSubjects = Object.keys(CURRICULUM)
  console.log(`\n📚 Seeding ${allSubjects.length} subjects...\n`)

  for (const subject of allSubjects) {
    const subjectData = CURRICULUM[subject]
    const examTypes   = Object.keys(subjectData)
    subjectStats[subject] = 0

    for (const examType of examTypes) {
      const { topics } = subjectData[examType]

      console.log(`\n▶ ${subject} — ${examType} (${topics.length} topics)`)

      for (const { topic, subtopics } of topics) {
        process.stdout.write(`  📌 ${topic.padEnd(35)} `)

        const questions = await generateBatch(
          subject,
          examType,
          topic,
          subtopics,
          YEARS.slice(0, 8)
        )

        if (questions.length > 0) {
          try {
            const result = await Question.insertMany(questions, { ordered: false })
            totalInserted        += result.length
            subjectStats[subject] += result.length
            console.log(`✓ +${result.length}`)
          } catch (err) {
            // insertMany with ordered: false continues past duplicates
            const inserted = err.result?.nInserted || 0
            totalInserted        += inserted
            subjectStats[subject] += inserted
            console.log(`✓ +${inserted} (some duplicates skipped)`)
          }
        } else {
          totalFailed++
          console.log('✗ generation failed')
        }

        // Small pause between topics to be respectful of rate limits
        await sleep(300)
      }
    }
  }

  // ── Final summary ──────────────────────────────────────────
  const finalCount = await Question.countDocuments()

  console.log('\n\n' + '━'.repeat(58))
  console.log('🎉 Seeding complete!\n')
  console.log('📊 Results by subject:')

  Object.entries(subjectStats).forEach(([subj, count]) => {
    const bar = '█'.repeat(Math.floor(count / 10))
    console.log(`   ${subj.padEnd(28)} ${String(count).padStart(4)} Qs  ${bar}`)
  })

  console.log('\n' + '━'.repeat(58))
  console.log(`   Questions inserted this run:  ${totalInserted}`)
  console.log(`   Failed batches:               ${totalFailed}`)
  console.log(`   Total in bank now:            ${finalCount}`)
  console.log('━'.repeat(58) + '\n')

  await mongoose.disconnect()
}

seedDemo().catch(err => {
  console.error('\n❌ Seeder crashed:', err.message)
  process.exit(1)
})