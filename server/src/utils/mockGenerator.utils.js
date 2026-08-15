import Question from '../models/Question.model.js'
import MasteryProfile from '../models/MasteryProfile.model.js'
import { generateAIJSON } from './aiService.js'

// ── WAEC paper structure constants ─────────────────────────────
export const PAPER_STRUCTURE = {
  sectionA: { type: 'MCQ',        count: 40, marksEach: 1,  totalMarks: 40 },
  sectionB: { type: 'Structured', count: 4,  marksEach: 10, totalMarks: 40 },
  sectionC: { type: 'Essay',      count: 2,  marksEach: 20, totalMarks: 40 },
  // Note: Section C — student answers ONE essay (20 marks)
  // so availableMarks = 100 total (40 + 40 + 20)
}

// ── Main paper generator ───────────────────────────────────────
// Assembles a full WAEC-standard paper from the question bank.
// Uses prediction data and mastery profile to weight selection —
// predicted hot topics + low mastery topics appear more frequently.
export const generatePaper = async (studentId, subject, examType) => {
  // ── 1. Get student mastery profiles ──────────────────────────
  const masteryProfiles = await MasteryProfile.find({
    studentId,
    subject,
  }).lean()

  const masteryMap = masteryProfiles.reduce((map, m) => {
    map[m.topic] = m.score
    return map
  }, {})

  // ── 2. Build weighting for topic selection ────────────────────
  // Topics with low mastery get a higher chance of appearing
  // This ensures the mock exam challenges the student appropriately
  const getTopicWeight = (topic) => {
    const score = masteryMap[topic] ?? 50  // unknown topics get medium weight
    // Invert score: low mastery = high weight
    return Math.max(10, 100 - score)
  }

  // ── 3. Fetch questions for each section ───────────────────────
  const [sectionAQuestions, sectionBQuestions, sectionCQuestions] =
    await Promise.all([
      fetchSectionQuestions(subject, examType, 'MCQ',        'A', 60, masteryMap),
      fetchSectionQuestions(subject, examType, 'Structured', 'B', 8,  masteryMap),
      fetchSectionQuestions(subject, examType, 'Essay',      'C', 4,  masteryMap),
    ])

  // ── 4. Select questions with mastery weighting ────────────────
  const selectedA = weightedSelect(sectionAQuestions, 40, getTopicWeight)
  const selectedB = weightedSelect(sectionBQuestions, 4,  getTopicWeight)
  const selectedC = weightedSelect(sectionCQuestions, 2,  getTopicWeight)

  // ── 5. If bank doesn't have enough, generate with AI ──────────
  const finalA = await fillWithAI(selectedA, 40, subject, examType, 'MCQ',        'A', 1)
  const finalB = await fillWithAI(selectedB, 4,  subject, examType, 'Structured', 'B', 10)
  const finalC = await fillWithAI(selectedC, 2,  subject, examType, 'Essay',      'C', 20)

  // ── 6. Format into exam question schema ───────────────────────
  return {
    sectionA: formatSection(finalA, 'A', 1),
    sectionB: formatSection(finalB, 'B', 2),  // numbering continues from A
    sectionC: formatSection(finalC, 'C', 3),  // continues from B
  }
}

// ── Fetch questions for a section from the database ────────────
const fetchSectionQuestions = async (
  subject, examType, type, section, fetchCount, masteryMap
) => {
  return Question.find({
    subject,
    examType,
    type,
    section,
    isActive: true,
  })
  .limit(fetchCount)
  .lean()
}

// ── Weighted random selection ──────────────────────────────────
// Topics with higher weight (lower mastery) are more likely
// to be selected for the paper.
const weightedSelect = (questions, count, getWeight) => {
  if (questions.length <= count) return questions

  const pool     = [...questions]
  const selected = []

  while (selected.length < count && pool.length > 0) {
    // Calculate total weight
    const totalWeight = pool.reduce((sum, q) => sum + getWeight(q.topic), 0)
    let rand          = Math.random() * totalWeight

    // Pick a question based on weight
    for (let i = 0; i < pool.length; i++) {
      rand -= getWeight(pool[i].topic)
      if (rand <= 0) {
        selected.push(pool.splice(i, 1)[0])
        break
      }
    }
  }

  return selected
}

// ── Fill gaps with AI-generated questions ─────────────────────
// If the question bank doesn't have enough questions for a
// section, Gemini generates the remaining ones.
const fillWithAI = async (
  existing, needed, subject, examType, type, section, marksEach
) => {
  if (existing.length >= needed) return existing.slice(0, needed)

  const gap = needed - existing.length
  if (gap === 0) return existing

  const systemPrompt = `You are a WAEC chief examiner generating exam questions.
Generate questions that exactly match WAEC ${examType} ${subject} standard.
Respond with valid JSON only. No markdown.`

  const prompt = `Generate ${gap} ${type} question(s) for a WAEC ${examType} ${subject} exam.
Section ${section} — ${marksEach} mark(s) each.
Make questions exam-standard, clear, and at appropriate difficulty.

${type === 'MCQ' ? `Return JSON array:
[{
  "questionText": "...",
  "options": ["option A text", "option B text", "option C text", "option D text"],
  "correctOption": "A",
  "modelAnswer": "",
  "topic": "topic name",
  "parts": []
}]` : type === 'Structured' ? `Return JSON array:
[{
  "questionText": "...",
  "options": [],
  "correctOption": "",
  "modelAnswer": "Detailed marking guide with key points",
  "topic": "topic name",
  "parts": [
    {"part": "a", "text": "...", "marks": 4, "answer": "..."},
    {"part": "b", "text": "...", "marks": 3, "answer": "..."},
    {"part": "c", "text": "...", "marks": 3, "answer": "..."}
  ]
}]` : `Return JSON array:
[{
  "questionText": "Write an essay on...",
  "options": [],
  "correctOption": "",
  "modelAnswer": "Essay marking guide covering all key criteria",
  "topic": "topic name",
  "parts": []
}]`}`

  try {
    const generated = await generateAIJSON(prompt, systemPrompt)
    const aiQuestions = Array.isArray(generated) ? generated : []

    // Tag AI-generated questions
    const tagged = aiQuestions.map(q => ({
      ...q,
      isAIGenerated: true,
      subject,
      examType,
      type,
      section,
      marks:      marksEach,
      difficulty: 3,
      year:       new Date().getFullYear(),
    }))

    return [...existing, ...tagged].slice(0, needed)
  } catch (err) {
    console.error('[MockGenerator] AI fill failed:', err.message)
    return existing  // return what we have if AI fails
  }
}

// ── Format questions into exam schema ──────────────────────────
const formatSection = (questions, section, startNumber) => {
  return questions.map((q, idx) => ({
    questionId:     q._id || null,
    section,
    type:           q.type,
    questionNumber: startNumber + idx,
    questionText:   q.questionText,
    options:        q.options   || [],
    correctOption:  q.correctOption || '',
    modelAnswer:    q.modelAnswer   || '',
    marks:          q.marks,
    topic:          q.topic,
    parts:          q.parts    || [],
    studentAnswer:  '',
    marksAwarded:   null,
    isCorrect:      null,
    aiFeedback:     '',
    partResults:    [],
  }))
}

// ── Batch AI marker for all non-MCQ answers ────────────────────
// Called after student submits the full paper.
// Sends all structured and essay answers to Gemini in one call
// to be more efficient than individual calls per question.
export const markFullPaper = async (exam) => {
  const subject = exam.subject

  // ── Section A: instant MCQ marking ───────────────────────────
  let sectionAMarks = 0
  const markedA = exam.sectionA.map(q => {
    const isCorrect = q.studentAnswer?.toUpperCase() ===
                      q.correctOption?.toUpperCase()
    const marksAwarded = isCorrect ? q.marks : 0
    sectionAMarks += marksAwarded
    return { ...q.toObject ? q.toObject() : q, isCorrect, marksAwarded, aiFeedback: '' }
  })

  // ── Section B + C: AI marking ─────────────────────────────────
  const nonMCQ = [
    ...exam.sectionB.map((q, i) => ({ ...q.toObject ? q.toObject() : q, _sectionKey: 'B', _idx: i })),
    ...exam.sectionC.map((q, i) => ({ ...q.toObject ? q.toObject() : q, _sectionKey: 'C', _idx: i })),
  ].filter(q => q.studentAnswer && q.studentAnswer.trim().length > 0)

  let sectionBMarks = 0
  let sectionCMarks = 0

  const markedB = exam.sectionB.map(q => ({
    ...q.toObject ? q.toObject() : q,
    marksAwarded: 0, isCorrect: false, aiFeedback: 'Not attempted', partResults: [],
  }))
  const markedC = exam.sectionC.map(q => ({
    ...q.toObject ? q.toObject() : q,
    marksAwarded: 0, isCorrect: false, aiFeedback: 'Not attempted', partResults: [],
  }))

  if (nonMCQ.length > 0) {
    const systemPrompt = `You are a WAEC ${subject} chief examiner marking student exam scripts.
Award marks strictly according to the marking guides provided.
Award partial marks where students show partial understanding.
Be fair, consistent, and examiner-standard in all feedback.
Respond with valid JSON only.`

    const questionsForAI = nonMCQ.map(q => ({
      section:       q._sectionKey,
      index:         q._idx,
      questionText:  q.questionText,
      marks:         q.marks,
      modelAnswer:   q.modelAnswer,
      parts:         q.parts,
      studentAnswer: q.studentAnswer,
      type:          q.type,
    }))

    const prompt = `Mark these ${subject} exam answers. For each question return marks and feedback.

Questions and student answers:
${JSON.stringify(questionsForAI, null, 2)}

Return a JSON array with one object per question:
[
  {
    "section": "B",
    "index": 0,
    "marksAwarded": 7,
    "marksAvailable": 10,
    "isCorrect": false,
    "aiFeedback": "Examiner comment on this answer",
    "partResults": [
      {"part": "a", "marksAwarded": 3, "marksAvailable": 4, "feedback": "..."},
      {"part": "b", "marksAwarded": 2, "marksAvailable": 3, "feedback": "..."},
      {"part": "c", "marksAwarded": 2, "marksAvailable": 3, "feedback": "..."}
    ]
  }
]`

    try {
      const aiResults = await generateAIJSON(prompt, systemPrompt)

      if (Array.isArray(aiResults)) {
        aiResults.forEach(result => {
          const { section, index, marksAwarded, isCorrect, aiFeedback, partResults } = result

          if (section === 'B' && markedB[index] !== undefined) {
            markedB[index] = {
              ...markedB[index],
              marksAwarded: marksAwarded || 0,
              isCorrect:    isCorrect    || false,
              aiFeedback:   aiFeedback   || '',
              partResults:  partResults  || [],
            }
            sectionBMarks += marksAwarded || 0
          }

          if (section === 'C' && markedC[index] !== undefined) {
            markedC[index] = {
              ...markedC[index],
              marksAwarded: marksAwarded || 0,
              isCorrect:    isCorrect    || false,
              aiFeedback:   aiFeedback   || '',
              partResults:  partResults  || [],
            }
            sectionCMarks += marksAwarded || 0
          }
        })
      }
    } catch (err) {
      console.error('[MockMarker] AI marking failed:', err.message)
    }
  }

  const totalMarks     = sectionAMarks + sectionBMarks + sectionCMarks
  const availableMarks = 100
  const percent        = Math.round((totalMarks / availableMarks) * 100)

  return {
    markedA,
    markedB,
    markedC,
    sectionAMarks,
    sectionBMarks,
    sectionCMarks,
    totalMarks,
    availableMarks,
    percent,
  }
}

// ── Generate overall examiner comment ─────────────────────────
export const generateExaminerComment = async (
  subject, totalMarks, availableMarks, sectionAMarks, sectionBMarks, sectionCMarks
) => {
  const percent = Math.round((totalMarks / availableMarks) * 100)

  const systemPrompt = `You are the chief WAEC ${subject} examiner writing a post-examination
candidate report. Write in formal examiner language.
Respond with plain text only — no JSON, no markdown.`

  const prompt = `Write a 3-sentence examiner comment for a candidate who scored:
- Section A (MCQ): ${sectionAMarks}/40
- Section B (Structured): ${sectionBMarks}/40
- Section C (Essay): ${sectionCMarks}/20
- Total: ${totalMarks}/100 (${percent}%)

Comment on their overall performance, strongest section,
and the area most in need of improvement.
Write as if this will appear on their official result report.`

  try {
    return await generateAIJSON(prompt, systemPrompt)
  } catch {
    const grade =
      percent >= 75 ? 'excellent' :
      percent >= 60 ? 'satisfactory' :
      percent >= 40 ? 'below expectations' : 'unsatisfactory'
    return `The candidate demonstrated ${grade} performance in this ${subject} examination, ` +
           `scoring ${totalMarks} out of 100 marks. ` +
           `Further practice is recommended across all sections.`
  }
}