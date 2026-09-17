import Class               from '../models/Class.model.js'
import Assignment          from '../models/Assignment.model.js'
import AssignmentSubmission from '../models/AssignmentSubmission.model.js'
import User                from '../models/User.model.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'

// ── Join code generation ────────────────────────────────────────
// Short, shareable, human-typeable — e.g. "MATH-7K2Q". Retries on the
// rare collision rather than trusting randomness alone, since the
// schema also enforces uniqueness at the DB level as a backstop.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I — avoids ambiguity when read aloud/copied
const randomCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')

const generateJoinCode = async (subject) => {
  const prefix = subject.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'CLSS'
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `${prefix}-${randomCode()}`
    if (!(await Class.exists({ joinCode: code }))) return code
  }
  throw new AppError('Could not generate a unique join code — please try again.', 500)
}

// ── POST /api/teacher/classes ──────────────────────────────────
export const createClass = asyncHandler(async (req, res) => {
  const { name, subject, examType = 'WASSCE' } = req.body
  if (!name || !subject) throw new AppError('Class name and subject are required', 400)

  const joinCode = await generateJoinCode(subject)

  const cls = await Class.create({
    teacherId: req.user._id,
    name,
    subject,
    examType,
    joinCode,
  })

  res.status(201).json({ success: true, message: 'Class created', class: cls })
})

// ── GET /api/teacher/classes ────────────────────────────────────
export const listClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find({ teacherId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('studentIds', 'fullName email')
    .lean()

  const withCounts = classes.map(c => ({
    ...c,
    studentCount: c.studentIds?.length || 0,
    students: c.studentIds || [], // [{ _id, fullName, email }] — the class roster
  }))

  res.json({ success: true, classes: withCounts })
})

// ── POST /api/teacher/assignments ──────────────────────────────
// Creates the assignment, then eagerly creates one AssignmentSubmission
// per student currently in the class — so progress ("0/25 submitted")
// is visible immediately and a student's pending-count query never
// needs to join against Assignment/Class at read time.
export const createAssignment = asyncHandler(async (req, res) => {
  const { classId, title, dueDate, questions } = req.body

  if (!classId || !title) throw new AppError('Class and title are required', 400)
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('At least one question is required', 400)
  }

  const cls = await Class.findOne({ _id: classId, teacherId: req.user._id })
  if (!cls) throw new AppError('Class not found', 404)

  const assignment = await Assignment.create({
    classId:  cls._id,
    teacherId: req.user._id,
    title,
    subject:  cls.subject,
    examType: cls.examType,
    dueDate:  dueDate || null,
    questions: questions.map(q => ({
      type:          q.type,
      questionText:  q.questionText,
      options:       q.options || [],
      correctOption: q.correctOption || '',
      modelAnswer:   q.modelAnswer || '',
      marks:         q.marks,
      topic:         q.topic || '',
      hasImage:      !!q.hasImage,
      imageData:     q.imageData || '',
      parts:         q.parts || [],
    })),
  })

  const availableMarks = assignment.questions.reduce((sum, q) => sum + (q.marks || 0), 0)

  if (cls.studentIds.length > 0) {
    await AssignmentSubmission.insertMany(
      cls.studentIds.map(studentId => ({
        assignmentId: assignment._id,
        studentId,
        answers: assignment.questions.map(() => ({})),
        availableMarks,
      })),
      { ordered: false }
    )
  }

  res.status(201).json({
    success: true,
    message: `Assignment created and sent to ${cls.studentIds.length} student${cls.studentIds.length !== 1 ? 's' : ''}`,
    assignment,
  })
})

// ── GET /api/teacher/assignments?classId= ──────────────────────
export const listAssignments = asyncHandler(async (req, res) => {
  const { classId } = req.query

  const classFilter = classId
    ? { _id: classId, teacherId: req.user._id }
    : { teacherId: req.user._id }
  const classIds = (await Class.find(classFilter).select('_id')).map(c => c._id)

  const assignments = await Assignment.find({ classId: { $in: classIds } })
    .sort({ createdAt: -1 })
    .lean()

  const counts = await AssignmentSubmission.aggregate([
    { $match: { assignmentId: { $in: assignments.map(a => a._id) } } },
    { $group: {
        _id: '$assignmentId',
        total:     { $sum: 1 },
        submitted: { $sum: { $cond: [{ $in: ['$status', ['submitted', 'pending_review', 'marked']] }, 1, 0] } },
      } },
  ])
  const countMap = new Map(counts.map(c => [c._id.toString(), c]))

  const withCounts = assignments.map(a => ({
    ...a,
    questionCount: a.questions?.length || 0,
    submittedCount: countMap.get(a._id.toString())?.submitted || 0,
    totalStudents:  countMap.get(a._id.toString())?.total || 0,
  }))

  res.json({ success: true, assignments: withCounts })
})

// ── Ownership helper ─────────────────────────────────────────────
// Shared by all three review endpoints below — a teacher may only see
// or act on submissions for assignments whose class they own.
const findOwnedSubmission = async (submissionId, teacherId) => {
  const submission = await AssignmentSubmission.findById(submissionId).populate('assignmentId')
  if (!submission || !submission.assignmentId) return null
  const owns = await Class.exists({ _id: submission.assignmentId.classId, teacherId })
  return owns ? submission : null
}

// ── GET /api/teacher/submissions?status=pending_review ──────────
// The review queue — submissions containing at least one photo-scanned
// answer, waiting for the teacher to check the AI's transcription/marks
// before they're released to the student.
export const listPendingReviews = asyncHandler(async (req, res) => {
  const classIds = (await Class.find({ teacherId: req.user._id }).select('_id')).map(c => c._id)
  const assignmentIds = (await Assignment.find({ classId: { $in: classIds } }).select('_id')).map(a => a._id)

  const submissions = await AssignmentSubmission.find({
    assignmentId: { $in: assignmentIds },
    status: 'pending_review',
  })
    .sort({ submittedAt: 1 }) // oldest first — first submitted, first reviewed
    .populate('studentId', 'fullName')
    .populate('assignmentId', 'title subject')
    .lean()

  res.json({
    success: true,
    submissions: submissions.map(s => ({
      submissionId: s._id,
      studentName:  s.studentId?.fullName || 'Unknown student',
      title:        s.assignmentId?.title || '',
      subject:      s.assignmentId?.subject || '',
      submittedAt:  s.submittedAt,
    })),
  })
})

// ── GET /api/teacher/submissions/:id ─────────────────────────────
// Full detail for one submission under review — unlike the student's
// own view, this includes correct answers/model answers and the AI's
// suggested marks, since the teacher needs them to judge quality.
export const getSubmissionForReview = asyncHandler(async (req, res) => {
  const submission = await findOwnedSubmission(req.params.id, req.user._id)
  if (!submission) throw new AppError('Submission not found', 404)

  const assignment = submission.assignmentId
  const student = await User.findById(submission.studentId).select('fullName')

  res.json({
    success: true,
    submission: {
      id: submission._id,
      status: submission.status,
      studentName: student?.fullName || 'Unknown student',
      answers: submission.answers,
    },
    assignment: {
      title: assignment.title,
      subject: assignment.subject,
      questions: assignment.questions,
    },
  })
})

// ── POST /api/teacher/submissions/:id/publish ────────────────────
// Releases the results to the student. `answers` is an optional array
// of {marksAwarded, aiFeedback} overrides, same order as the
// assignment's questions — a teacher happy with the AI's read can call
// this with no body at all; one correcting a misread scan only needs
// to send the entries they changed marks/feedback for other questions
// are left as the AI originally computed them.
export const publishSubmission = asyncHandler(async (req, res) => {
  const { answers: overrides } = req.body
  const submission = await findOwnedSubmission(req.params.id, req.user._id)
  if (!submission) throw new AppError('Submission not found', 404)
  if (submission.status !== 'pending_review') {
    throw new AppError('This submission is not awaiting review', 400)
  }

  if (Array.isArray(overrides)) {
    overrides.forEach((override, i) => {
      if (!override || !submission.answers[i]) return
      if (override.marksAwarded !== undefined) submission.answers[i].marksAwarded = Number(override.marksAwarded)
      if (override.aiFeedback   !== undefined) submission.answers[i].aiFeedback   = override.aiFeedback
    })
    submission.markModified('answers')
  }

  const totalMarks = submission.answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0)
  submission.totalMarks = totalMarks
  submission.percent    = submission.availableMarks > 0 ? Math.round((totalMarks / submission.availableMarks) * 100) : 0
  submission.status     = 'marked'
  submission.markedAt   = new Date()
  await submission.save()

  res.json({
    success: true,
    message: 'Results published to student',
    results: {
      totalMarks: submission.totalMarks,
      availableMarks: submission.availableMarks,
      percent: submission.percent,
    },
  })
})
