import MockExam    from '../models/MockExam.model.js'
import Session     from '../models/Session.model.js'
import User        from '../models/User.model.js'
import { checkAndAwardBadges, updateStreak } from '../utils/badge.utils.js'
import {
  generatePaper,
  markFullPaper,
  generateExaminerComment,
} from '../utils/mockGenerator.utils.js'
import { calculateWAECGrade } from '../utils/marking.utils.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'
import { resolveExamType } from '../utils/examType.utils.js'

// ── POST /api/mock-exams/generate ──────────────────────────────
// Generates a full WAEC-standard paper for the student.
// Uses prediction data + mastery profile to weight question selection.
export const generateMockExam = asyncHandler(async (req, res) => {
  const { subject } = req.body
  const examType = resolveExamType(req, req.body.examType)

  if (!subject) throw new AppError('Subject is required', 400)

  // Check if student has an in-progress exam
  const existing = await MockExam.findOne({
    studentId: req.user._id,
    subject,
    status: 'in_progress',
  })

  if (existing) {
    return res.json({
      success:  true,
      message:  'Resuming existing exam',
      exam:     sanitiseExam(existing),
      resumed:  true,
    })
  }

  // Generate the paper
  const paper = await generatePaper(req.user._id, subject, examType)

  const exam = await MockExam.create({
    studentId:          req.user._id,
    subject,
    examType,
    year:               new Date().getFullYear(),
    status:             'generated',
    sectionA:           paper.sectionA,
    sectionB:           paper.sectionB,
    sectionC:           paper.sectionC,
    timeAllowedMinutes: 160,
  })

  res.status(201).json({
    success: true,
    message: 'Exam paper generated',
    exam:    sanitiseExam(exam),
    resumed: false,
  })
})

// ── POST /api/mock-exams/:id/start ────────────────────────────
// Marks the exam as started and records start time.
// The countdown timer begins from this point.
export const startExam = asyncHandler(async (req, res) => {
  const exam = await MockExam.findOne({
    _id:       req.params.id,
    studentId: req.user._id,
  })

  if (!exam) throw new AppError('Exam not found', 404)
  if (exam.status === 'submitted') throw new AppError('This exam has already been submitted', 400)

  exam.status    = 'in_progress'
  exam.startedAt = exam.startedAt || new Date()
  await exam.save()

  res.json({ success: true, message: 'Exam started', startedAt: exam.startedAt })
})

// ── PATCH /api/mock-exams/:id/answer ──────────────────────────
// Save a student's answer for a single question without submitting.
// Called periodically as student progresses through the paper.
// This is important — if the browser crashes, answers are preserved.
export const saveAnswer = asyncHandler(async (req, res) => {
  const { section, questionIndex, studentAnswer } = req.body

  if (!['sectionA', 'sectionB', 'sectionC'].includes(section)) {
    throw new AppError('Invalid section', 400)
  }

  const exam = await MockExam.findOne({
    _id:       req.params.id,
    studentId: req.user._id,
    status:    'in_progress',
  })

  if (!exam) throw new AppError('Active exam not found', 404)

  // Update the specific question's answer
  if (exam[section][questionIndex] !== undefined) {
    exam[section][questionIndex].studentAnswer = studentAnswer
    exam.markModified(section)
    await exam.save()
  }

  res.json({ success: true, message: 'Answer saved' })
})

// ── POST /api/mock-exams/:id/submit ───────────────────────────
// Student submits the full paper for marking.
// Triggers AI marking of all Section B and C answers.
// This is the main action after the exam ends.
export const submitExam = asyncHandler(async (req, res) => {
  const { answers, timeSpentSeconds } = req.body

  const exam = await MockExam.findOne({
    _id:       req.params.id,
    studentId: req.user._id,
  })

  if (!exam) throw new AppError('Exam not found', 404)
  if (exam.status === 'marked') {
    return res.json({ success: true, message: 'Already marked', exam })
  }

  // ── Apply final answers if provided ───────────────────────────
  if (answers) {
    if (answers.sectionA) {
      answers.sectionA.forEach((ans, i) => {
        if (exam.sectionA[i]) exam.sectionA[i].studentAnswer = ans
      })
    }
    if (answers.sectionB) {
      answers.sectionB.forEach((ans, i) => {
        if (exam.sectionB[i]) exam.sectionB[i].studentAnswer = ans
      })
    }
    if (answers.sectionC) {
      answers.sectionC.forEach((ans, i) => {
        if (exam.sectionC[i]) exam.sectionC[i].studentAnswer = ans
      })
    }
  }

  exam.status          = 'submitted'
  exam.submittedAt     = new Date()
  exam.timeSpentSeconds = timeSpentSeconds || 0
  exam.markModified('sectionA')
  exam.markModified('sectionB')
  exam.markModified('sectionC')
  await exam.save()

  // ── Mark the paper ────────────────────────────────────────────
  const marking = await markFullPaper(exam)

  // ── Generate examiner comment ──────────────────────────────
  const examinerComment = await generateExaminerComment(
    exam.subject,
    marking.totalMarks,
    marking.availableMarks,
    marking.sectionAMarks,
    marking.sectionBMarks,
    marking.sectionCMarks,
  )

  const gradeInfo = calculateWAECGrade(marking.totalMarks, marking.availableMarks)

  // ── Save marked results ───────────────────────────────────────
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

  // ── Save as a session for analytics ──────────────────────────
  await Session.create({
    studentId:     req.user._id,
    sessionType:   'mock',
    subject:       exam.subject,
    examType:      exam.examType,
    totalMarks:    marking.totalMarks,
    availableMarks: marking.availableMarks,
    accuracy:      marking.percent,
    duration:      timeSpentSeconds || 0,
    waecGrade:     gradeInfo.grade,
  })

  // Update user totals
  await User.findByIdAndUpdate(req.user._id, {
    $inc: {
      totalQuestionsAnswered: exam.sectionA.length + exam.sectionB.length + 1,
    },
    lastActive: new Date(),
  })
  await updateStreak(req.user._id)
  const newBadges = await checkAndAwardBadges(req.user._id)
  res.json({
    success:  true,
    message:  'Exam marked successfully',
    results:  exam.results,
    examId:   exam._id,
    newBadges,          // ← add this line
  })
})

// ── GET /api/mock-exams/:id ────────────────────────────────────
// Get a specific exam — used to load in-progress or marked exam.
export const getExam = asyncHandler(async (req, res) => {
  const exam = await MockExam.findOne({
    _id:       req.params.id,
    studentId: req.user._id,
  })

  if (!exam) throw new AppError('Exam not found', 404)

  // Don't send correct answers for in-progress exams
  const payload = exam.status === 'in_progress'
    ? sanitiseExam(exam)
    : exam

  res.json({ success: true, exam: payload })
})

// ── GET /api/mock-exams ────────────────────────────────────────
// Get all mock exams for this student.
export const getMyExams = asyncHandler(async (req, res) => {
  const { subject, status } = req.query

  const filter = { studentId: req.user._id }
  if (subject) filter.subject = subject
  if (status)  filter.status  = status

  const exams = await MockExam.find(filter)
    .sort({ createdAt: -1 })
    .limit(20)
    .select('subject examType status results createdAt submittedAt timeAllowedMinutes')
    .lean()

  res.json({ success: true, exams })
})

// ── GET /api/mock-exams/admin/all-results ─────────────────────
// Admin — see all students' mock exam results.
export const getAllResults = asyncHandler(async (req, res) => {
  const { subject, status = 'marked' } = req.query

  const filter = { status }
  if (subject) filter.subject = subject

  const exams = await MockExam.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('studentId', 'fullName email school')
    .select('subject examType status results createdAt studentId isPhysicalEntry')
    .lean()

  res.json({ success: true, exams })
})

// ── Sanitise exam for in-progress state ───────────────────────
// Removes correct answers before sending to client.
// We never want to leak answers while the exam is active.
const sanitiseExam = (exam) => {
  const obj = exam.toObject ? exam.toObject() : { ...exam }

  obj.sectionA = obj.sectionA.map(q => ({
    ...q,
    correctOption: undefined,  // hidden during exam
    modelAnswer:   undefined,
  }))
  obj.sectionB = obj.sectionB.map(q => ({
    ...q,
    modelAnswer: undefined,
    parts: q.parts?.map(p => ({ ...p, answer: undefined })),
  }))
  obj.sectionC = obj.sectionC.map(q => ({
    ...q,
    modelAnswer: undefined,
  }))

  return obj
}