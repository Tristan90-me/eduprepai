import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import mongoose from 'mongoose'
import { GoogleGenAI } from '@google/genai'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI
const GEMINI_KEY  = process.env.GEMINI_API_KEY

if (!MONGODB_URI || !GEMINI_KEY) {
  console.error('\n❌ Missing environment variables. Check server/.env\n')
  process.exit(1)
}

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY })

// ── We import directly — no need for the full Express app ──────
import { CURRICULUM, YEARS, QUESTION_CONFIG } from './seedData.js'

// ── MongoDB connection ─────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env')
  process.exit(1)
}

// ── Gemini client ──────────────────────────────────────────────
const ai = new GoogleGenAI({})

// ── Minimal Question schema (avoids importing the full app) ────
const questionSchema = new mongoose.Schema({
  subject:           String,
  examType:          String,
  year:              Number,
  topic:             String,
  subtopic:          String,
  syllabusReference: String,
  type:              String,
  difficulty:        Number,
  marks:             Number,
  section:           String,
  questionText:      String,
  options:           [String],
  correctOption:     String,
  modelAnswer:       String,
  explanation:       String,
  parts:             Array,
  isActive:          { type: Boolean, default: true },
  isAIGenerated:     { type: Boolean, default: true },
}, { timestamps: true })

// ── Rate limit helper ──────────────────────────────────────────
// Free tier: 15 requests/minute. We pace ourselves to 12/min to be safe.
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let requestCount = 0
let windowStart  = Date.now()

const rateLimit = async () => {
  requestCount++
  if (requestCount >= 12) {
    const elapsed = Date.now() - windowStart
    const wait    = Math.max(0, 62000 - elapsed)  // wait to next minute
    if (wait > 0) {
      console.log(`   ⏳ Rate limit pause: ${Math.round(wait/1000)}s…`)
      await sleep(wait)
    }
    requestCount = 0
    windowStart  = Date.now()
  }
}

// ── Core AI question generator ─────────────────────────────────
const generateQuestions = async ({
  subject, examType, topic, subtopic, year,
  type, section, marks, difficulty, count,
}) => {
  await rateLimit()

  const diffLabels = {
    1: 'foundation — basic recall',
    2: 'standard — straightforward application',
    3: 'intermediate — multi-step reasoning',
    4: 'advanced — complex analysis',
    5: 'examiner — highest WAEC standard',
  }

// ── Math formatting instructions ───────────────────────────────
const NON_MATH_SUBJECTS = ['English Language', 'Social Studies', 'History',
  'French', 'Religious & Moral Education', 'Creative Arts And Design',
  'Career Technology', 'Computing', 'Economics']

const MATH_NOTE = NON_MATH_SUBJECTS.includes(subject) ? '' : `
CRITICAL — Write all maths in plain readable text:
- Fractions: write "(3x + 1)/(x - 2)" NOT \\frac{3x+1}{x-2}
- Roots: write "sqrt(5)" or "root(3, 8)" NOT \\sqrt{}
- Powers: write "x^2" or "2^n" NOT x^{2}
- Use × for multiply, ÷ for divide, ≥ ≤ for inequalities
- Use brackets clearly: "3sqrt(5) / (sqrt(5) - 2)"
`

  const typeInstructions = type === 'MCQ'
    ? `Return a JSON array of ${count} MCQ questions.
Each object: { "questionText": "...", "options": ["optionA", "optionB", "optionC", "optionD"], "correctOption": "A"|"B"|"C"|"D", "modelAnswer": "", "parts": [] }`
    : type === 'Structured'
    ? `Return a JSON array of ${count} structured questions.
Each object: { "questionText": "...", "options": [], "correctOption": "", "modelAnswer": "detailed marking guide with key points worth marks", "parts": [{"part":"a","text":"...","marks":4,"answer":"..."},{"part":"b","text":"...","marks":3,"answer":"..."},{"part":"c","text":"...","marks":3,"answer":"..."}] }`
    : `Return a JSON array of ${count} essay questions.
Each object: { "questionText": "Write an essay on...", "options": [], "correctOption": "", "modelAnswer": "detailed marking guide covering all key assessment criteria", "parts": [] }`

  const prompt = `You are a WAEC chief examiner for ${examType} ${subject} in Ghana.
Generate ${count} authentic past-paper-style ${type} question(s) for ${year}.

Subject: ${subject}
Topic: ${topic}
Subtopic: ${subtopic}
Year style: ${year} examination
Difficulty: Level ${difficulty} — ${diffLabels[difficulty] || 'intermediate'}
Section: ${section} (${marks} mark${marks > 1 ? 's' : ''} per question)

Requirements:
- Questions must match authentic WAEC ${examType} phrasing and format
- Use Ghanaian context where relevant (names, places, currency in GHS, local examples)
- Questions must be answerable from the standard ${examType} ${subject} curriculum
- Vary question phrasing — avoid repeating the same sentence structure
- For MCQ: ensure only ONE option is clearly correct; distractors should be plausible

${typeInstructions}

Return ONLY the JSON array. No markdown. No preamble. No explanation.`

  try {
    const response = await ai.models.generateContent({
      model:    'gemini-3.5-flash-lite',
      contents: prompt,
    })

    const raw     = response.text
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/, '')
      .trim()

    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return []

    return parsed.map(q => ({
      subject,
      examType,
      year,
      topic,
      subtopic,
      syllabusReference: `WAEC ${examType} ${subject} — ${topic}`,
      type,
      section,
      marks,
      difficulty,
      questionText:  q.questionText  || '',
      options:       q.options       || [],
      correctOption: q.correctOption || '',
      modelAnswer:   q.modelAnswer   || '',
      explanation:   '',
      parts:         q.parts         || [],
      isActive:      true,
      isAIGenerated: true,
    }))
  } catch (err) {
    console.error(`   ⚠️  Generation failed for ${subject}/${topic}/${type}/${year}: ${err.message?.slice(0, 80)}`)
    return []
  }
}

// ── Main seeder ────────────────────────────────────────────────
const seed = async () => {
  console.log('\n🌱 EduPrepAI Question Bank Seeder')
  console.log('━'.repeat(50))

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI, { dbName: 'eduprepai' })
  console.log('✅ Connected to MongoDB\n')

  // Register model
  const Question = mongoose.models.Question ||
    mongoose.model('Question', questionSchema)

  // Count existing questions
  const existing = await Question.countDocuments()
  console.log(`📊 Existing questions in bank: ${existing}`)

  if (existing > 500) {
    console.log('⚠️  Question bank already has 500+ questions.')
    console.log('   Run with --force flag to add more: node scripts/seedQuestions.js --force')
    if (!process.argv.includes('--force')) {
      await mongoose.disconnect()
      return
    }
  }

  let totalInserted = 0
  const allSubjects = Object.keys(CURRICULUM)

  // ── Loop: subject → examType → topic → year → question types ─
  for (const subject of allSubjects) {
    const subjectData = CURRICULUM[subject]
    const examTypes   = Object.keys(subjectData)

    for (const examType of examTypes) {
      const { topics } = subjectData[examType]
      console.log(`\n📚 ${subject} — ${examType} (${topics.length} topics)`)

      for (const { topic, subtopics } of topics) {
        console.log(`   📌 Topic: ${topic}`)

        // ── Past paper questions: 10 years × MCQ batch ────────
        // We generate in batches by year to simulate real past papers
        for (const year of YEARS) {
          const subtopic = subtopics[year % subtopics.length] // rotate subtopics

          // 8 MCQ per year per topic (simulates a real paper's coverage)
          const mcqs = await generateQuestions({
            subject, examType, topic, subtopic, year,
            type: 'MCQ', section: 'A', marks: 1,
            difficulty: [2, 3, 3, 4, 4][year % 5],
            count: 6,
          })

          if (mcqs.length > 0) {
            await Question.insertMany(mcqs, { ordered: false })
            totalInserted += mcqs.length
            process.stdout.write(`      ${year}: +${mcqs.length} MCQ`)
          }

          // Structured questions every other year
          if (year % 2 === 0) {
            const structured = await generateQuestions({
              subject, examType, topic, subtopic, year,
              type: 'Structured', section: 'B', marks: 10,
              difficulty: [3, 4][year % 2],
              count: 1,
            })
            if (structured.length > 0) {
              await Question.insertMany(structured, { ordered: false })
              totalInserted += structured.length
              process.stdout.write(` +${structured.length} Structured`)
            }
          }

          process.stdout.write('\n')
        }

        // ── Essay questions (fewer, higher value) ─────────────
        // 2 essays per topic across the 10 year span
        const essays = await generateQuestions({
          subject, examType, topic,
          subtopic: subtopics[0],
          year: 2022,
          type: 'Essay', section: 'C', marks: 20,
          difficulty: 4,
          count: 2,
        })
        if (essays.length > 0) {
          await Question.insertMany(essays, { ordered: false })
          totalInserted += essays.length
          console.log(`      Essays: +${essays.length}`)
        }

        console.log(`   ✓ ${topic} complete`)
      }

      console.log(`\n✅ ${subject} ${examType} seeded`)
    }
  }

  console.log('\n' + '━'.repeat(50))
  console.log(`🎉 Seeding complete!`)
  console.log(`📊 Questions inserted this run: ${totalInserted}`)
  const finalCount = await Question.countDocuments()
  console.log(`📊 Total questions in bank:     ${finalCount}`)
  console.log('━'.repeat(50) + '\n')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('❌ Seeder failed:', err)
  process.exit(1)
})