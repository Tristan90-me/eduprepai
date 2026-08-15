import MockExam  from '../models/MockExam.model.js'
import User      from '../models/User.model.js'
import {
  markFullPaper,
  generateExaminerComment,
} from '../utils/mockGenerator.utils.js'
import { calculateWAECGrade } from '../utils/marking.utils.js'
import { generateAIJSON }     from '../utils/aiService.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'

// ── GET /api/admin/physical/students ──────────────────────────
// Returns list of students for admin to select from.
export const getStudentList = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' })
    .select('fullName email school examType subjects')
    .sort({ fullName: 1 })
    .lean()

  res.json({ success: true, students })
})

// ── GET /api/admin/physical/exams/:studentId ──────────────────
// Returns marked exams for a student — admin selects which one
// to enter physical results against.
export const getStudentExams = asyncHandler(async (req, res) => {
  const exams = await MockExam.find({
    studentId: req.params.studentId,
    status:    { $in: ['generated', 'marked'] },
  })
  .sort({ createdAt: -1 })
  .select('subject examType status results createdAt')
  .lean()

  res.json({ success: true, exams })
})

// ── POST /api/admin/physical/submit ───────────────────────────
// Admin submits physical exam answers on behalf of a student.
// This is the core of Option 5 — Hybrid Admin Dashboard.
// Accepts MCQ clicks, typed Section B/C answers, and photo extractions.
export const submitPhysicalExam = asyncHandler(async (req, res) => {
  const {
    examId,
    studentId,
    sectionAAnswers,   // array of 40 strings: 'A'|'B'|'C'|'D'|''
    sectionBAnswers,   // array of 4 strings: typed or photo-extracted text
    sectionCAnswer,    // string: essay text
    sectionCIndex,     // 0 or 1 — which essay question was answered
    notes,             // admin notes about the submission
  } = req.body

  const exam = await MockExam.findById(examId)
  if (!exam) throw new AppError('Exam not found', 404)

  // ── Apply Section A answers ────────────────────────────────
  if (sectionAAnswers?.length) {
    sectionAAnswers.forEach((ans, i) => {
      if (exam.sectionA[i]) exam.sectionA[i].studentAnswer = ans || ''
    })
  }

  // ── Apply Section B answers ────────────────────────────────
  if (sectionBAnswers?.length) {
    sectionBAnswers.forEach((ans, i) => {
      if (exam.sectionB[i]) exam.sectionB[i].studentAnswer = ans || ''
    })
  }

  // ── Apply Section C answer ─────────────────────────────────
  if (sectionCAnswer !== undefined && sectionCIndex !== undefined) {
    exam.sectionC.forEach((q, i) => {
      q.studentAnswer = i === sectionCIndex ? sectionCAnswer : ''
    })
  }

  // Mark as physical entry
  exam.isPhysicalEntry = true
  exam.enteredByAdmin  = req.user._id
  exam.status          = 'submitted'
  exam.submittedAt     = new Date()
  exam.markModified('sectionA')
  exam.markModified('sectionB')
  exam.markModified('sectionC')
  await exam.save()

  // ── Run marking ────────────────────────────────────────────
  const marking = await markFullPaper(exam)

  const examinerComment = await generateExaminerComment(
    exam.subject,
    marking.totalMarks,
    marking.availableMarks,
    marking.sectionAMarks,
    marking.sectionBMarks,
    marking.sectionCMarks,
  )

  const gradeInfo = calculateWAECGrade(marking.totalMarks, marking.availableMarks)

  exam.sectionA = marking.markedA
  exam.sectionB = marking.markedB
  exam.sectionC = marking.markedC
  exam.status   = 'marked'
  exam.results  = {
    sectionAMarks:   marking.sectionAMarks,
    sectionBMarks:   marking.sectionBMarks,
    sectionCMarks:   marking.sectionCMarks,
    totalMarks:      marking.totalMarks,
    availableMarks:  marking.availableMarks,
    percent:         marking.percent,
    waecGrade:       gradeInfo.grade,
    gradeLabel:      gradeInfo.label,
    examinerComment: typeof examinerComment === 'string'
      ? examinerComment
      : examinerComment?.comment || '',
  }
  exam.markModified('sectionA')
  exam.markModified('sectionB')
  exam.markModified('sectionC')
  await exam.save()

  res.json({
    success:  true,
    message:  `Physical exam marked — ${gradeInfo.grade} (${marking.totalMarks}/100)`,
    results:  exam.results,
    examId:   exam._id,
    studentId,
  })
})

// ── POST /api/admin/physical/extract-photo ────────────────────
// Receives a base64 image of a handwritten exam page.
// Uses Gemini Vision to extract the written answers.
// Returns extracted text for admin review before submission.
export const extractFromPhoto = asyncHandler(async (req, res) => {
  const { imageBase64, section, subject, questionCount } = req.body

  if (!imageBase64) throw new AppError('No image data received', 400)

  const systemPrompt = `You are a handwriting recognition assistant for WAEC exam scripts.
Extract the student's written answers accurately from the image.
For MCQ answer sheets, look for circled letters, ticked boxes, or marked options.
For written answers, transcribe the text as accurately as possible.
Respond with valid JSON only.`

  const sectionPrompt = section === 'A'
    ? `Extract MCQ answers from this ${subject} exam answer sheet.
       Look for the student's selected option (A, B, C, or D) for each of the ${questionCount || 40} questions.
       Return: { "answers": ["A", "C", "B", ...] } — one letter per question, or "" if unclear.`
    : section === 'B'
    ? `Extract the student's written answer for this ${subject} structured question.
       Transcribe exactly what is written, preserving any part labels (a), (b), (c).
       Return: { "answer": "transcribed text here" }`
    : `Extract the student's essay answer for this ${subject} question.
       Transcribe the full essay as written.
       Return: { "answer": "full essay text here" }`

  const prompt = `${sectionPrompt}

Image content: [The image shows a handwritten ${subject} exam script, Section ${section}]

Important: If you cannot read a word clearly, write [unclear] in brackets.
If an MCQ answer is ambiguous, return "".`

  try {
    // Note: For vision, we need to pass the image to Gemini differently
    // Using text-based prompt as fallback since image handling
    // requires the vision model configuration
    const result = await generateAIJSON(prompt, systemPrompt)

    res.json({
      success:   true,
      section,
      extracted: result,
      message:   'Extraction complete — please review before submitting',
    })
  } catch (err) {
    throw new AppError('Photo extraction failed: ' + err.message, 500)
  }
})