import Question from '../models/Question.model.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'

// ── POST /api/questions ────────────────────────────────────────
// Admin only — add a single question to the bank
export const createQuestion = asyncHandler(async (req, res) => {
  const question = await Question.create({
    ...req.body,
    addedBy: req.user._id,
  })

  res.status(201).json({
    success: true,
    message: 'Question added successfully',
    question,
  })
})

// ── POST /api/questions/bulk ───────────────────────────────────
// Admin only — add multiple questions at once (array upload)
export const bulkCreateQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('Please provide an array of questions', 400)
  }

  // Attach the admin's ID to every question
  const tagged = questions.map((q) => ({ ...q, addedBy: req.user._id }))
  const inserted = await Question.insertMany(tagged, { ordered: false })

  res.status(201).json({
    success: true,
    message: `${inserted.length} questions added successfully`,
    count: inserted.length,
  })
})

// ── GET /api/questions ─────────────────────────────────────────
// Students & admins — filtered question retrieval
// Supports: ?subject=&topic=&type=&difficulty=&year=&examType=&limit=
export const getQuestions = asyncHandler(async (req, res) => {
  const {
    subject, topic, subtopic, type,
    difficulty, year, examType,
    limit = 10, page = 1,
  } = req.query

  // Build filter dynamically — only include fields that were provided
  const filter = { isActive: true }
  if (subject)    filter.subject    = subject
  if (topic)      filter.topic      = topic
  if (subtopic)   filter.subtopic   = subtopic
  if (type)       filter.type       = type
  if (examType)   filter.examType   = examType
  if (difficulty) filter.difficulty = Number(difficulty)
  if (year)       filter.year       = Number(year)

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Question.countDocuments(filter)

  const questions = await Question.find(filter)
    .sort({ year: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select('-explanation -modelAnswer') // don't send answers to client by default

  res.json({
    success: true,
    count:   questions.length,
    total,
    page:    Number(page),
    pages:   Math.ceil(total / Number(limit)),
    questions,
  })
})

// ── GET /api/questions/:id ─────────────────────────────────────
// Get a single question by ID (includes model answer for review)
export const getQuestionById = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
  if (!question) throw new AppError('Question not found', 404)

  res.json({ success: true, question })
})

// ── PUT /api/questions/:id ─────────────────────────────────────
// Admin only — update a question
export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
  if (!question) throw new AppError('Question not found', 404)

  res.json({ success: true, message: 'Question updated', question })
})

// ── DELETE /api/questions/:id ──────────────────────────────────
// Admin only — soft delete (deactivate, not remove)
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  )
  if (!question) throw new AppError('Question not found', 404)

  res.json({ success: true, message: 'Question deactivated' })
})

// ── GET /api/questions/topics ──────────────────────────────────
// Returns all unique topics for a given subject
// Used by: prediction engine, gap detector, practice filter
export const getTopicsBySubject = asyncHandler(async (req, res) => {
  const { subject, examType } = req.query
  if (!subject) throw new AppError('Subject is required', 400)

  const filter = { isActive: true, subject }
  if (examType) filter.examType = examType

  // Get distinct topics and count questions per topic
  const topics = await Question.aggregate([
    { $match: filter },
    {
      $group: {
        _id:          '$topic',
        count:        { $sum: 1 },
        years:        { $addToSet: '$year' },
        latestYear:   { $max: '$year' },
        difficulties: { $addToSet: '$difficulty' },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        topic:        '$_id',
        count:        1,
        years:        1,
        latestYear:   1,
        difficulties: 1,
        _id:          0,
      },
    },
  ])

  res.json({ success: true, subject, topics })
})

// ── GET /api/questions/stats ───────────────────────────────────
// Admin — overview of question bank coverage
export const getQuestionBankStats = asyncHandler(async (req, res) => {
  const stats = await Question.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id:      '$subject',
        total:    { $sum: 1 },
        mcq:      { $sum: { $cond: [{ $eq: ['$type', 'MCQ'] },        1, 0] } },
        struct:   { $sum: { $cond: [{ $eq: ['$type', 'Structured'] }, 1, 0] } },
        essay:    { $sum: { $cond: [{ $eq: ['$type', 'Essay'] },      1, 0] } },
        topics:   { $addToSet: '$topic' },
        years:    { $addToSet: '$year' },
      },
    },
    {
      $project: {
        subject:      '$_id',
        total:        1,
        mcq:          1,
        structured:   '$struct',
        essay:        1,
        topicCount:   { $size: '$topics' },
        yearRange:    { min: { $min: '$years' }, max: { $max: '$years' } },
        _id:          0,
      },
    },
    { $sort: { total: -1 } },
  ])

  const grandTotal = await Question.countDocuments({ isActive: true })

  res.json({ success: true, grandTotal, bySubject: stats })
})