import Class                from '../models/Class.model.js'
import Assignment           from '../models/Assignment.model.js'
import AssignmentSubmission from '../models/AssignmentSubmission.model.js'
import { markMCQ, markStructured, markEssay } from '../utils/marking.utils.js'
import { generateAIJSONWithImages } from '../utils/aiService.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'

// ── POST /api/assignments/join ─────────────────────────────────
// A student joins a class by entering the teacher-shared code.
// Note: this only affects assignments created FROM NOW ON — Assignment
// creation eagerly snapshots the class roster into AssignmentSubmission
// docs at that moment (see teacher.controller.js's createAssignment),
// so joining doesn't retroactively backfill submissions for assignments
// that already existed before this student joined.
export const joinClass = asyncHandler(async (req, res) => {
  const { joinCode } = req.body
  if (!joinCode) throw new AppError('Join code is required', 400)

  const cls = await Class.findOne({ joinCode: joinCode.trim().toUpperCase() })
  if (!cls) throw new AppError('Invalid join code', 404)

  if (cls.studentIds.some(id => id.equals(req.user._id))) {
    throw new AppError('You have already joined this class', 409)
  }

  cls.studentIds.push(req.user._id)
  await cls.save()

  res.json({ success: true, message: `Joined ${cls.name} (${cls.subject})`, class: cls })
})

// ── GET /api/assignments/classes ───────────────────────────────
// Classes the student has already joined — shown in Settings.
export const getMyClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find({ studentIds: req.user._id })
    .select('name subject examType joinCode teacherId createdAt')
    .populate('teacherId', 'fullName')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, classes })
})

// ── GET /api/assignments ────────────────────────────────────────
// My submissions, joined with assignment/class info for display.
export const listMyAssignments = asyncHandler(async (req, res) => {
  const { subject } = req.query

  const submissions = await AssignmentSubmission.find({ studentId: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'assignmentId',
      select: 'title subject examType dueDate questions classId',
      populate: { path: 'classId', select: 'name' },
    })
    .lean()

  const withDerived = submissions
    .filter(s => s.assignmentId) // guard against an assignment somehow deleted later
    .map(s => ({
      submissionId: s._id,
      status:       s.status,
      totalMarks:   s.totalMarks,
      availableMarks: s.availableMarks,
      percent:      s.percent,
      title:        s.assignmentId.title,
      subject:      s.assignmentId.subject,
      examType:     s.assignmentId.examType,
      dueDate:      s.assignmentId.dueDate,
      className:    s.assignmentId.classId?.name || '',
      questionCount: s.assignmentId.questions?.length || 0,
      createdAt:    s.createdAt,
    }))
    .filter(a => !subject || a.subject === subject)

  res.json({ success: true, assignments: withDerived })
})

// ── GET /api/assignments/pending-count ─────────────────────────
export const getPendingCount = asyncHandler(async (req, res) => {
  const count = await AssignmentSubmission.countDocuments({
    studentId: req.user._id,
    status: { $in: ['assigned', 'in_progress'] },
  })
  res.json({ success: true, count })
})

// ── GET /api/assignments/:submissionId ─────────────────────────
// One assignment + my current answers, for the answer screen.
// Marks the submission 'in_progress' on first open.
export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await AssignmentSubmission.findOne({
    _id: req.params.submissionId,
    studentId: req.user._id,
  }).populate('assignmentId')

  if (!submission) throw new AppError('Assignment not found', 404)

  if (submission.status === 'assigned') {
    submission.status = 'in_progress'
    await submission.save()
  }

  const assignment = submission.assignmentId
  // 'marked' is the only status where marks/correct-answers are shown —
  // 'pending_review' still locks the answers read-only (can't re-edit
  // after submitting) but must not leak the AI's suggested marks before
  // the teacher signs off, same treatment as an in-progress attempt.
  const isLocked = ['submitted', 'pending_review', 'marked'].includes(submission.status)
  const showResults = submission.status === 'marked'

  res.json({
    success: true,
    submission: {
      id:      submission._id,
      status:  submission.status,
      answers: showResults ? submission.answers : submission.answers.map(a => ({ studentAnswer: a.studentAnswer })),
      totalMarks: showResults ? submission.totalMarks : null,
      availableMarks: showResults ? submission.availableMarks : null,
      percent: showResults ? submission.percent : null,
      isReview: isLocked,
    },
    // Model answers/correct options are only meaningful once results are
    // shown — hide them otherwise, same principle as sanitiseExam does
    // for mock exams.
    assignment: {
      id: assignment._id,
      title: assignment.title,
      subject: assignment.subject,
      examType: assignment.examType,
      dueDate: assignment.dueDate,
      questions: assignment.questions.map(q => showResults ? q : {
        type: q.type, questionText: q.questionText, options: q.options,
        marks: q.marks, topic: q.topic, hasImage: q.hasImage,
        imageData: q.imageData, parts: q.parts?.map(p => ({ part: p.part, text: p.text, marks: p.marks })),
      }),
    },
  })
})

// ── PATCH /api/assignments/:submissionId/answer ────────────────
// Save one answer without submitting — mirrors mockExam.controller.js's
// saveAnswer, so the browser crashing doesn't lose progress.
export const saveAnswer = asyncHandler(async (req, res) => {
  const { questionIndex, studentAnswer, wasScanned } = req.body

  const submission = await AssignmentSubmission.findOne({
    _id: req.params.submissionId,
    studentId: req.user._id,
  })
  if (!submission) throw new AppError('Assignment not found', 404)
  if (['submitted', 'pending_review', 'marked'].includes(submission.status)) {
    throw new AppError('This assignment has already been submitted', 400)
  }

  if (!submission.answers[questionIndex]) throw new AppError('Invalid question index', 400)
  submission.answers[questionIndex].studentAnswer = studentAnswer || ''
  // Sticky once true — a submission is flagged for teacher review if
  // scanning was used anywhere in it, even if the student edits the
  // transcribed text afterward.
  if (wasScanned) submission.answers[questionIndex].wasScanned = true
  submission.markModified('answers')
  await submission.save()

  res.json({ success: true })
})

// ── POST /api/assignments/:submissionId/submit ─────────────────
// Marks the paper. Reuses the exact same per-question marking
// primitives practice mode uses (markMCQ/markStructured/markEssay) —
// no new marking logic, and no batching like mock exams' markFullPaper
// since an assignment is a flat list, not a sectioned paper.
export const submitSubmission = asyncHandler(async (req, res) => {
  const submission = await AssignmentSubmission.findOne({
    _id: req.params.submissionId,
    studentId: req.user._id,
  }).populate('assignmentId')

  if (!submission) throw new AppError('Assignment not found', 404)
  if (['submitted', 'pending_review', 'marked'].includes(submission.status)) {
    throw new AppError('This assignment has already been submitted', 400)
  }

  const assignment = submission.assignmentId
  submission.status = 'submitted'
  submission.submittedAt = new Date()

  let totalMarks = 0
  let availableMarks = 0
  let hasScannedAnswer = false

  for (let i = 0; i < assignment.questions.length; i++) {
    const question = assignment.questions[i]
    const studentAnswer = submission.answers[i]?.studentAnswer || ''
    const wasScanned = !!submission.answers[i]?.wasScanned
    if (wasScanned) hasScannedAnswer = true
    availableMarks += question.marks || 0

    let result
    if (!studentAnswer.trim()) {
      result = { isCorrect: false, marksAwarded: 0, partResults: [], overallFeedback: 'Not answered.' }
    } else if (question.type === 'MCQ') {
      result = markMCQ(studentAnswer, question.correctOption, question.marks)
    } else if (question.type === 'Structured') {
      result = await markStructured(question, studentAnswer, assignment.subject)
    } else {
      result = await markEssay(question, studentAnswer, assignment.subject)
    }

    totalMarks += result.marksAwarded || 0
    submission.answers[i] = {
      studentAnswer,
      wasScanned,
      marksAwarded: result.marksAwarded || 0,
      isCorrect:    result.isCorrect || false,
      aiFeedback:   result.overallFeedback || '',
      partResults:  result.partResults || [],
    }
  }

  submission.totalMarks     = totalMarks
  submission.availableMarks = availableMarks
  submission.percent        = availableMarks > 0 ? Math.round((totalMarks / availableMarks) * 100) : 0
  submission.markModified('answers')

  // Typed/MCQ-only submissions get instant marking, unchanged from
  // Phase 1. A submission with any photo-scanned answer instead waits
  // for teacher review — the AI's marks are computed and stored above
  // (so the teacher has a starting point) but not shown to the student
  // yet, since scan-transcription accuracy hasn't been human-checked.
  if (hasScannedAnswer) {
    submission.status = 'pending_review'
    await submission.save()
    return res.json({
      success: true,
      message: 'Submitted — your teacher will review before results are shown.',
      results: null,
    })
  }

  submission.status   = 'marked'
  submission.markedAt = new Date()
  await submission.save()

  res.json({
    success: true,
    message: 'Assignment marked',
    results: {
      totalMarks: submission.totalMarks,
      availableMarks: submission.availableMarks,
      percent: submission.percent,
    },
  })
})

// ── POST /api/assignments/extract-photo ─────────────────────────
// Transcribes a photo of a handwritten/typed answer into text, using
// the vision-capable AI call (generateAIJSONWithImages) — unlike the
// existing extract-photo endpoint on the admin Physical Exam panel,
// which accepts imageBase64 but never actually sends it to the AI.
// Pure preview: nothing is saved here. The student reviews/edits the
// transcription before it's saved as their real answer via saveAnswer.
export const extractAnswerFromPhoto = asyncHandler(async (req, res) => {
  const { imageBase64, mimeType, questionText } = req.body
  if (!imageBase64) throw new AppError('No photo received', 400)

  const systemPrompt = `You transcribe a student's handwritten or typed exam answer from a
photo into plain text, exactly as written. Do not correct, grade, or
comment on the answer — just transcribe it.
Respond with valid JSON only. No markdown. No preamble.`

  const prompt = `The question being answered:
${questionText || '(not provided)'}

Transcribe the student's answer shown in the photo. If the answer is
labelled in parts — e.g. (a)(i), (a)(ii), (b) — preserve those exact
labels at the start of each part's text, each on its own line, so the
structure is clear. If there are no part labels, just transcribe the
answer as continuous text.

Return this exact JSON structure:
{ "transcribedAnswer": "..." }`

  const result = await generateAIJSONWithImages(prompt, systemPrompt, [
    { mimeType: mimeType || 'image/jpeg', data: imageBase64 },
  ])

  res.json({ success: true, transcribedAnswer: result.transcribedAnswer || '' })
})
