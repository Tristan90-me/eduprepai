import { generateAIJSON } from './aiService.js'

// ── WAEC grade calculator ──────────────────────────────────────
// Takes a raw score and total available marks.
// Returns the official WAEC grade and label.
export const calculateWAECGrade = (score, totalMarks) => {
  if (!totalMarks) return { grade: 'N/A', label: 'No marks', percent: 0 }

  const percent = Math.round((score / totalMarks) * 100)

  if (percent >= 75) return { grade: 'A1', label: 'Excellent',  percent }
  if (percent >= 70) return { grade: 'B2', label: 'Very Good',  percent }
  if (percent >= 65) return { grade: 'B3', label: 'Good',       percent }
  if (percent >= 60) return { grade: 'C4', label: 'Credit',     percent }
  if (percent >= 55) return { grade: 'C5', label: 'Credit',     percent }
  if (percent >= 50) return { grade: 'C6', label: 'Credit',     percent }
  if (percent >= 45) return { grade: 'D7', label: 'Pass',       percent }
  if (percent >= 40) return { grade: 'E8', label: 'Pass',       percent }
  return                     { grade: 'F9', label: 'Fail',       percent }
}

// ── MCQ marker ────────────────────────────────────────────────
// Simple string comparison — no AI needed.
// Returns marking result for a single MCQ answer.
export const markMCQ = (studentAnswer, correctAnswer, marks = 1) => {
  const isCorrect = studentAnswer?.trim().toUpperCase() ===
                    correctAnswer?.trim().toUpperCase()
  return {
    isCorrect,
    marksAwarded:   isCorrect ? marks : 0,
    marksAvailable: marks,
  }
}

// ── AI structured question marker ─────────────────────────────
// Sends student answer + marking guide to Gemini.
// Returns per-part marks and feedback.
export const markStructured = async (question, studentAnswer, subject) => {
  const systemPrompt = `You are an experienced WAEC ${subject} examiner.
Mark student answers fairly and consistently against the marking guide.
Award partial marks where the student shows partial understanding.
Be constructive — explain what was missing, not just what was wrong.
Respond with valid JSON only. No markdown. No preamble.`

  const prompt = `
QUESTION:
${question.questionText}

MARKING GUIDE (model answer):
${question.modelAnswer || 'No model answer provided — use your expertise.'}

PARTS AND ALLOCATIONS:
${question.parts?.map(p => `Part (${p.part}) — ${p.marks} marks: ${p.text}`).join('\n') || 'No parts defined'}

STUDENT'S ANSWER:
${studentAnswer}

Mark this answer. For each part award marks based on:
- Accuracy of content
- Correct use of terminology
- Clarity of explanation
- Whether key marking points are addressed

Return this exact JSON structure:
{
  "parts": [
    {
      "part": "a",
      "marksAwarded": 2,
      "marksAvailable": 3,
      "feedback": "Good explanation of X but missed Y which is worth 1 mark."
    }
  ],
  "totalMarksAwarded": 5,
  "totalMarksAvailable": 10,
  "overallFeedback": "Examiner comment on the overall response."
}`

  try {
    const result = await generateAIJSON(prompt, systemPrompt)
    return {
      isCorrect:      result.totalMarksAwarded >= result.totalMarksAvailable * 0.5,
      marksAwarded:   result.totalMarksAwarded   || 0,
      marksAvailable: result.totalMarksAvailable || question.marks,
      partResults:    result.parts               || [],
      overallFeedback: result.overallFeedback    || '',
    }
  } catch (err) {
    console.error('[Marking] Structured marking failed:', err.message)
    // Graceful fallback — don't crash the session
    return {
      isCorrect:      false,
      marksAwarded:   0,
      marksAvailable: question.marks,
      partResults:    [],
      overallFeedback: 'Marking unavailable — please review manually.',
    }
  }
}

// ── AI essay marker ───────────────────────────────────────────
// Marks essays on four WAEC criteria.
export const markEssay = async (question, studentAnswer, subject) => {
  const systemPrompt = `You are an experienced WAEC ${subject} examiner marking essay responses.
Use the official WAEC essay assessment criteria.
Be fair, constructive, and specific in your feedback.
Respond with valid JSON only. No markdown. No preamble.`

  const prompt = `
ESSAY QUESTION:
${question.questionText}

TOTAL MARKS AVAILABLE: ${question.marks || 20}

STUDENT'S ESSAY:
${studentAnswer}

Mark this essay using these four WAEC criteria.
Allocate marks proportionally based on the total available (${question.marks || 20} marks):
1. Content & relevance (40% of marks) — did they answer the question?
2. Organisation (20% of marks) — is it structured logically?
3. Language & expression (20% of marks) — is English accurate?
4. Depth & analysis (20% of marks) — does it show understanding?

Return this exact JSON structure:
{
  "criteria": [
    { "name": "Content & relevance",   "marksAwarded": 7, "marksAvailable": 8, "feedback": "..." },
    { "name": "Organisation",          "marksAwarded": 3, "marksAvailable": 4, "feedback": "..." },
    { "name": "Language & expression", "marksAwarded": 3, "marksAvailable": 4, "feedback": "..." },
    { "name": "Depth & analysis",      "marksAwarded": 3, "marksAvailable": 4, "feedback": "..." }
  ],
  "totalMarksAwarded": 16,
  "totalMarksAvailable": 20,
  "examinerComment": "Overall examiner comment on the quality of the response.",
  "passFailIndicator": "Pass"
}`

  try {
    const result = await generateAIJSON(prompt, systemPrompt)
    return {
      isCorrect:        result.totalMarksAwarded >= result.totalMarksAvailable * 0.5,
      marksAwarded:     result.totalMarksAwarded   || 0,
      marksAvailable:   result.totalMarksAvailable || question.marks,
      partResults:      result.criteria            || [],
      overallFeedback:  result.examinerComment     || '',
      passFailIndicator: result.passFailIndicator  || 'N/A',
    }
  } catch (err) {
    console.error('[Marking] Essay marking failed:', err.message)
    return {
      isCorrect:       false,
      marksAwarded:    0,
      marksAvailable:  question.marks,
      partResults:     [],
      overallFeedback: 'Marking unavailable — please review manually.',
    }
  }
}

// ── AI explanation generator ───────────────────────────────────
// Called when student taps "Explain this" after answering.
// Returns a structured explanation object.
export const generateExplanation = async (question, studentAnswer, isCorrect, subject) => {
  const systemPrompt = `You are an expert ${subject} tutor helping a WASSCE/BECE student understand 
examination questions. Your explanations are clear, encouraging, and exam-focused.
You always reference WAEC examiner expectations.
Respond with valid JSON only. No markdown. No preamble.`

  const prompt = `
QUESTION: ${question.questionText}

${question.type === 'MCQ' ? `
OPTIONS:
A. ${question.options?.[0] || ''}
B. ${question.options?.[1] || ''}
C. ${question.options?.[2] || ''}
D. ${question.options?.[3] || ''}
CORRECT ANSWER: ${question.correctOption}
STUDENT'S ANSWER: ${studentAnswer}
STUDENT WAS: ${isCorrect ? 'CORRECT' : 'INCORRECT'}
` : `
MODEL ANSWER: ${question.modelAnswer || ''}
STUDENT'S ANSWER: ${studentAnswer}
`}

Generate a helpful explanation for this student.

Return this exact JSON:
{
  "conceptExplained": "What concept or skill is this question testing?",
  "whyCorrectIsRight": "Clear explanation of why the correct answer is right.",
  "whyStudentWasWrong": "If incorrect: why the student's answer was wrong. If correct: what they did well.",
  "commonMistakes": "What do most candidates get wrong on this type of question?",
  "studyTip": "One specific study tip for this topic.",
  "keyTerms": ["term1", "term2"]
}`

  try {
    return await generateAIJSON(prompt, systemPrompt)
  } catch (err) {
    console.error('[Marking] Explanation generation failed:', err.message)
    return {
      conceptExplained:  'Explanation unavailable.',
      whyCorrectIsRight: question.type === 'MCQ' ? `The correct answer is ${question.correctOption}.` : 'See model answer.',
      whyStudentWasWrong: '',
      commonMistakes:    '',
      studyTip:          `Review your ${question.topic} notes and practice similar questions.`,
      keyTerms:          [],
    }
  }
}

// ── Mastery score updater ──────────────────────────────────────
// Pure function — takes current mastery state and answer result,
// returns new score and difficulty. No database calls.
export const computeMasteryUpdate = (current, isCorrect, marksAwarded, marksAvailable) => {
  const partialCredit = marksAvailable > 0 ? marksAwarded / marksAvailable : 0

  let newScore       = current.score
  let consecutiveCorrect   = current.consecutiveCorrect   || 0
  let consecutiveIncorrect = current.consecutiveIncorrect || 0
  let newDifficulty  = current.difficulty || 2

  if (isCorrect || partialCredit >= 0.7) {
    // Good answer — increase mastery
    const gain = isCorrect ? 5 : 3
    newScore = Math.min(100, newScore + gain)
    consecutiveCorrect   += 1
    consecutiveIncorrect  = 0

    // Level up after 3 consecutive correct answers
    if (consecutiveCorrect >= 3 && newDifficulty < 5) {
      newDifficulty      += 1
      consecutiveCorrect  = 0
    }
  } else {
    // Wrong answer — decrease mastery slightly
    const loss = partialCredit < 0.3 ? 3 : 1
    newScore = Math.max(0, newScore - loss)
    consecutiveIncorrect += 1
    consecutiveCorrect    = 0

    // Level down after 2 consecutive wrong answers
    if (consecutiveIncorrect >= 2 && newDifficulty > 1) {
      newDifficulty       -= 1
      consecutiveIncorrect = 0
    }
  }

  return {
    score:                newScore,
    difficulty:           newDifficulty,
    consecutiveCorrect,
    consecutiveIncorrect,
  }
}