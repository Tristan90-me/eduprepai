import Question from '../models/Question.model.js'
import MasteryProfile from '../models/MasteryProfile.model.js'
import { generateAIJSON } from './aiService.js'
import { getCurriculumScope, formatScopeNote } from './curriculumGrounding.utils.js'

// ── WAEC paper structure constants ─────────────────────────────
// Generic default — applies to every subject/exam-type combo that
// doesn't have a real structure of its own in SUBJECT_PAPER_STRUCTURES.
export const PAPER_STRUCTURE = {
  sectionA: { type: 'MCQ',        count: 40, marksEach: 1,  totalMarks: 40 },
  sectionB: { type: 'Structured', count: 4,  marksEach: 10, totalMarks: 40 },
  sectionC: { type: 'Essay',      count: 2,  marksEach: 20, totalMarks: 40 },
  sectionCAnswerCount: 1,
  // Note: Section C — student answers ONE essay (20 marks)
  // so availableMarks = 100 total (40 + 40 + 20)
}

// ── Real per-subject paper structures ──────────────────────────
// BECE Computing's actual paper: Paper 1 (Objectives, 40 MCQ) already
// matches the generic Section A. Paper 2 (Essay, 60 marks) does not:
// Section A is Question 1, compulsory, 24 marks (usually practical/
// diagram-based); Section B offers 4 questions, student answers any
// 3 at 12 marks each = 36. Real transcribed questions for this
// subject already carry the correct `marks` value (24 / 12) even
// though their type/section tagging is inconsistent, so this section
// fetches by marks rather than the generic type+section filter.
// BECE Mathematics' actual paper: Section A (Objectives, 40 MCQ, 1 mark
// each = 40) already matches the generic Section A. There is no
// separate compulsory theory section like Computing's — WAEC's own
// "Section B" (6 questions offered, each with (a)/(b)/(c)-style parts,
// student answers any 4 at 15 marks each = 60) maps entirely onto this
// app's `sectionC` bucket, since that's the one built to handle
// "answer N of M offered" — `sectionB` is deliberately left empty
// (count 0) for this subject. `type: 'Structured'` (not 'Essay') on
// that bucket matters: these are genuinely multi-part structured
// answers, and it's what tells fillWithAI to generate dotted-part
// questions when the bank is thin, not free-form essay filler.
export const SUBJECT_PAPER_STRUCTURES = {
  'BECE:Computing': {
    sectionA: { type: 'MCQ',        count: 40, marksEach: 1,  totalMarks: 40, fetchBy: 'typeSection' },
    sectionB: { type: 'Structured', count: 1,  marksEach: 24, totalMarks: 24, fetchBy: 'marks' },
    sectionC: { type: 'Essay',      count: 4,  marksEach: 12, totalMarks: 36, fetchBy: 'marks' },
    sectionCAnswerCount: 3,
  },
  'BECE:Mathematics': {
    sectionA: { type: 'MCQ',        count: 40, marksEach: 1,  totalMarks: 40, fetchBy: 'typeSection' },
    sectionB: { type: 'Structured', count: 0,  marksEach: 0,  totalMarks: 0 },
    sectionC: { type: 'Structured', count: 6,  marksEach: 15, totalMarks: 60, fetchBy: 'marks' },
    sectionCAnswerCount: 4,
  },
  // BECE Science's actual paper: Objectives (40 MCQ) matches the generic
  // Section A. Theory Paper has its own "Section A" — Question 1,
  // compulsory, 40 marks, often diagram-based — mapped onto this app's
  // `sectionB` bucket (mirrors Computing's one-compulsory-question
  // precedent). Theory Paper's own "Section B" offers 4 questions,
  // student answers any 3 at 20 marks each = 60, mapped onto `sectionC`.
  // Raw total available is 40+40+60=140, not the usual 100 — markFullPaper
  // scales the final total/percent down to a 100 basis for this reason.
  'BECE:Science': {
    sectionA: { type: 'MCQ',        count: 40, marksEach: 1,  totalMarks: 40, fetchBy: 'typeSection' },
    sectionB: { type: 'Structured', count: 1,  marksEach: 40, totalMarks: 40, fetchBy: 'marks' },
    sectionC: { type: 'Structured', count: 4,  marksEach: 20, totalMarks: 60, fetchBy: 'marks' },
    sectionCAnswerCount: 3,
  },
  // BECE English Language's actual paper: Paper 1 (Objectives, 40 MCQ)
  // matches the generic Section A. Paper 2 has THREE real parts — Essay
  // Writing (offer 3, answer 1, 30 marks), Comprehension (compulsory, one
  // passage, 20 marks), and Literature (compulsory, 10 marks) — but this
  // app only has two non-MCQ buckets. Comprehension + Literature are
  // merged into one compulsory `sectionB` item (both are compulsory
  // anyway); `promptHint` tells the AI generator how to split it into a
  // passage + comprehension parts + "[Literature]"-prefixed parts, since
  // the generic Structured prompt has no way to know that on its own.
  // Essay Writing maps onto `sectionC`'s existing "offer M, answer N"
  // mechanic exactly as-is.
  'BECE:English Language': {
    sectionA: { type: 'MCQ',        count: 40, marksEach: 1,  totalMarks: 40, fetchBy: 'typeSection' },
    sectionB: {
      type: 'Structured', count: 1, marksEach: 30, totalMarks: 30, fetchBy: 'marksAndType',
      promptHint: `This compulsory question combines two parts. Write a short reading passage ` +
        `(150-250 words, Ghanaian/West African context) as the questionText. Then use "parts" for: ` +
        `3-4 comprehension sub-questions about the passage (lettered a, b, c... testing understanding, ` +
        `vocabulary and inference) worth a combined 20 marks, followed by 2 literature sub-questions ` +
        `(continuing the same letter sequence) worth a combined 10 marks, based on a well-known West ` +
        `African prescribed text (e.g. a Ghanaian novel, play or poem) — prefix each literature part's ` +
        `"text" with "[Literature]" so it reads as clearly distinct from the comprehension parts.`,
    },
    // sectionB and sectionC coincidentally share marksEach: 30 (Comprehension+
    // Literature = 20+10, Essay = 30) — `fetchBy: 'marksAndType'` on both
    // disambiguates them by `type` ('Structured' vs 'Essay') too.
    sectionC: { type: 'Essay', count: 3, marksEach: 30, totalMarks: 30, fetchBy: 'marksAndType' },
    sectionCAnswerCount: 1,
  },
}

export const getPaperStructure = (examType, subject) =>
  SUBJECT_PAPER_STRUCTURES[`${examType}:${subject}`] || PAPER_STRUCTURE

// ── Main paper generator ───────────────────────────────────────
// Assembles a full WAEC-standard paper from the question bank.
// Uses prediction data and mastery profile to weight selection —
// predicted hot topics + low mastery topics appear more frequently.
export const generatePaper = async (studentId, subject, examType) => {
  const structure = getPaperStructure(examType, subject)

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
      fetchSectionQuestions(subject, examType, structure.sectionA, 'A', 60, masteryMap),
      fetchSectionQuestions(subject, examType, structure.sectionB, 'B', Math.max(8, structure.sectionB.count * 2), masteryMap),
      fetchSectionQuestions(subject, examType, structure.sectionC, 'C', Math.max(4, structure.sectionC.count * 2), masteryMap),
    ])

  // ── 4. Select questions with mastery weighting ────────────────
  const selectedA = weightedSelect(sectionAQuestions, structure.sectionA.count, getTopicWeight)
  const selectedB = weightedSelect(sectionBQuestions, structure.sectionB.count, getTopicWeight)
  const selectedC = weightedSelect(sectionCQuestions, structure.sectionC.count, getTopicWeight)

  // ── 5. If bank doesn't have enough, generate with AI ──────────
  const finalA = await fillWithAI(selectedA, structure.sectionA.count, subject, examType, structure.sectionA.type, 'A', structure.sectionA.marksEach, structure.sectionA.promptHint)
  const finalB = await fillWithAI(selectedB, structure.sectionB.count, subject, examType, structure.sectionB.type, 'B', structure.sectionB.marksEach, structure.sectionB.promptHint)
  const finalC = await fillWithAI(selectedC, structure.sectionC.count, subject, examType, structure.sectionC.type, 'C', structure.sectionC.marksEach, structure.sectionC.promptHint)

  // ── 6. Format into exam question schema ───────────────────────
  return {
    sectionA: formatSection(finalA, 'A', 1),
    sectionB: formatSection(finalB, 'B', 2),  // numbering continues from A
    sectionC: formatSection(finalC, 'C', 3),  // continues from B
    sectionCAnswerCount: structure.sectionCAnswerCount,
  }
}

// ── Fetch questions for a section from the database ────────────
// sectionConfig.fetchBy selects the filter strategy:
// - 'typeSection' (default, every generic-structure subject): match
//   on the question's type + section fields, as always.
// - 'marks': match on the question's marks value instead — used for
//   BECE Computing's Section B/C, where real transcribed questions
//   already carry the correct marks (24 / 12) but inconsistent
//   type/section tags, so marks is the reliable signal.
const fetchSectionQuestions = async (
  subject, examType, sectionConfig, section, fetchCount, masteryMap
) => {
  const filter = { subject, examType, isActive: true }

  if (sectionConfig.fetchBy === 'marksAndType') {
    // Like 'marks', but also filters on `type` — needed when two
    // sections of the same subject coincidentally share a marksEach
    // value (e.g. BECE English Language: sectionB's compulsory
    // Comprehension+Literature item and sectionC's Essay questions are
    // both 30 marks), so a plain marks-only filter would pull sectionC's
    // essay topics into sectionB's fetch pool and vice versa.
    filter.marks = sectionConfig.marksEach
    filter.type  = sectionConfig.type
  } else if (sectionConfig.fetchBy === 'marks') {
    filter.marks = sectionConfig.marksEach
  } else {
    filter.type    = sectionConfig.type
    filter.section = section
  }

  return Question.find(filter)
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
  existing, needed, subject, examType, type, section, marksEach, promptHint
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
${promptHint ? `\n${promptHint}\n` : ''}
${type === 'MCQ' ? `Return JSON array:
[{
  "questionText": "...",
  "options": ["option A text", "option B text", "option C text", "option D text"],
  "correctOption": "A",
  "modelAnswer": "",
  "topic": "topic name",
  "parts": []
}]` : type === 'Structured' ? `If a part naturally divides further (e.g. part (a) has two
distinct sub-questions), use a dotted leaf label combining them —
"a.i", "a.ii", "b.i" — each with only its own share of the marks,
instead of one entry for the whole of (a). A part with no further
division just keeps its own letter, e.g. "b".
Return JSON array:
[{
  "questionText": "...",
  "options": [],
  "correctOption": "",
  "modelAnswer": "Detailed marking guide with key points",
  "topic": "topic name",
  "parts": [
    {"part": "a", "text": "...", "marks": 4, "answer": "..."},
    {"part": "b.i", "text": "...", "marks": 2, "answer": "..."},
    {"part": "b.ii", "text": "...", "marks": 1, "answer": "..."}
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
    hasImage:       q.hasImage  || false,
    imageData:      q.imageData || '',
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
  const structure = getPaperStructure(exam.examType, exam.subject)

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

    const questionsForAI = nonMCQ.map(q => {
      const scopeNote = formatScopeNote(getCurriculumScope(subject, q.topic))
      return {
        section:       q._sectionKey,
        index:         q._idx,
        questionText:  q.questionText,
        marks:         q.marks,
        modelAnswer:   q.modelAnswer,
        parts:         q.parts,
        studentAnswer: q.studentAnswer,
        type:          q.type,
        ...(scopeNote && { curriculumNote: scopeNote }),
      }
    })

    const prompt = `Mark these ${subject} exam answers. For each question return marks and feedback.
If a question includes a "curriculumNote", grade strictly within that syllabus scope.

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

  // Raw earned/available on the paper's own basis — most subjects sum to
  // 100 already, but some (e.g. BECE Science: 40+40+60=140) don't, so the
  // final headline total/percent is normalized onto a 100 basis here.
  // Section-level breakdowns below stay raw/unscaled.
  const rawEarned      = sectionAMarks + sectionBMarks + sectionCMarks
  const rawAvailable   = structure.sectionA.totalMarks + structure.sectionB.totalMarks + structure.sectionC.totalMarks
  const availableMarks = 100
  const totalMarks     = Math.round((rawEarned / rawAvailable) * 100)
  const percent        = totalMarks

  return {
    markedA,
    markedB,
    markedC,
    sectionAMarks,
    sectionBMarks,
    sectionCMarks,
    sectionATotal: structure.sectionA.totalMarks,
    sectionBTotal: structure.sectionB.totalMarks,
    sectionCTotal: structure.sectionC.totalMarks,
    totalMarks,
    availableMarks,
    percent,
  }
}

// ── Generate overall examiner comment ─────────────────────────
export const generateExaminerComment = async (
  subject, totalMarks, availableMarks, sectionAMarks, sectionBMarks, sectionCMarks,
  sectionATotal = 40, sectionBTotal = 40, sectionCTotal = 20
) => {
  const percent = Math.round((totalMarks / availableMarks) * 100)

  const systemPrompt = `You are the chief WAEC ${subject} examiner writing a post-examination
candidate report. Write in formal examiner language.
Respond with plain text only — no JSON, no markdown.`

  const prompt = `Write a 3-sentence examiner comment for a candidate who scored:
- Section A (MCQ): ${sectionAMarks}/${sectionATotal}
- Section B (Structured): ${sectionBMarks}/${sectionBTotal}
- Section C (Essay): ${sectionCMarks}/${sectionCTotal}
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