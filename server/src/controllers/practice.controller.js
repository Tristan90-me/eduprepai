import Question      from '../models/Question.model.js'
import MasteryProfile from '../models/MasteryProfile.model.js'
import Session       from '../models/Session.model.js'
import User          from '../models/User.model.js'
import {
  markMCQ,
  markStructured,
  markEssay,
  generateExplanation,
  computeMasteryUpdate,
  calculateWAECGrade,
} from '../utils/marking.utils.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'

// ── GET /api/practice/questions ────────────────────────────────
// Fetches questions for a practice session.
// Uses the student's mastery profile to determine
// which difficulty level to serve.
export const getPracticeQuestions = asyncHandler(async (req, res) => {
  const {
    subject,
    topic,
    examType = 'WASSCE',
    type,                    // MCQ, Structured, Essay — optional filter
    limit = 10,
  } = req.query

  if (!subject) throw new AppError('Subject is required', 400)

  // ── Get student's current mastery for this topic ───────────
  let targetDifficulty = 2  // default: Standard
  if (topic) {
    const mastery = await MasteryProfile.findOne({
      studentId: req.user._id,
      subject,
      topic,
    })
    if (mastery) targetDifficulty = mastery.difficulty
  }

  // ── Build question filter ──────────────────────────────────
  const filter = {
    subject,
    examType,
    isActive: true,
    // Serve questions at or near the student's level
    difficulty: {
      $in: [
        Math.max(1, targetDifficulty - 1),
        targetDifficulty,
        Math.min(5, targetDifficulty + 1),
      ],
    },
  }

  if (topic) filter.topic = topic
  if (type)  filter.type  = type

  // ── Fetch and shuffle ──────────────────────────────────────
  const total = await Question.countDocuments(filter)
  const skip  = Math.floor(Math.random() * Math.max(0, total - Number(limit)))

  const questions = await Question.find(filter)
    .skip(skip)
    .limit(Number(limit))
    .select('-explanation')   // don't send explanations upfront
    .lean()

  // ── Get mastery data for all topics returned ───────────────
  const topics = [...new Set(questions.map(q => q.topic))]
  const masteryProfiles = await MasteryProfile.find({
    studentId: req.user._id,
    subject,
    topic: { $in: topics },
  }).lean()

  const masteryMap = masteryProfiles.reduce((map, m) => {
    map[m.topic] = m
    return map
  }, {})

  res.json({
    success:   true,
    count:     questions.length,
    questions: questions.map(q => ({
      ...q,
      // Attach mastery info to each question's topic
      topicMastery: masteryMap[q.topic] || null,
    })),
  })
})

// ── GET /api/practice/topics ───────────────────────────────────
// Returns all topics for a subject with the student's mastery
// score for each — used by the topic picker on the practice page.
export const getTopicsWithMastery = asyncHandler(async (req, res) => {
  const { subject, examType = 'WASSCE' } = req.query
  if (!subject) throw new AppError('Subject is required', 400)

  // All distinct topics in question bank for this subject
  const topicAgg = await Question.aggregate([
    { $match: { subject, examType, isActive: true } },
    {
      $group: {
        _id:         '$topic',
        count:       { $sum: 1 },
        latestYear:  { $max: '$year' },
      },
    },
    { $sort: { count: -1 } },
  ])

  // Student's mastery for these topics
  const masteryProfiles = await MasteryProfile.find({
    studentId: req.user._id,
    subject,
  }).lean()

  const masteryMap = masteryProfiles.reduce((map, m) => {
    map[m.topic] = m
    return map
  }, {})

  // Merge topic list with mastery data
  const topics = topicAgg.map(t => ({
    topic:      t._id,
    count:      t.count,
    latestYear: t.latestYear,
    mastery:    masteryMap[t._id] || null,
    score:      masteryMap[t._id]?.score      || 0,
    difficulty: masteryMap[t._id]?.difficulty || 2,
    attempted:  !!masteryMap[t._id],
  }))

  res.json({ success: true, subject, topics })
})

// ── POST /api/practice/submit ──────────────────────────────────
// Student submits a single answer.
// Marks it, updates mastery profile, returns result.
export const submitAnswer = asyncHandler(async (req, res) => {
  const {
    questionId,
    studentAnswer,
    timeTaken = 0,
  } = req.body

  if (!questionId || studentAnswer === undefined) {
    throw new AppError('questionId and studentAnswer are required', 400)
  }

  // ── Fetch the question ─────────────────────────────────────
  const question = await Question.findById(questionId)
  if (!question) throw new AppError('Question not found', 404)

  // ── Mark the answer ────────────────────────────────────────
  let markingResult

  if (question.type === 'MCQ') {
    markingResult = markMCQ(studentAnswer, question.correctOption, question.marks)
  } else if (question.type === 'Structured') {
    markingResult = await markStructured(question, studentAnswer, question.subject)
  } else {
    markingResult = await markEssay(question, studentAnswer, question.subject)
  }

  // ── Update mastery profile ─────────────────────────────────
  const currentMastery = await MasteryProfile.findOne({
    studentId: req.user._id,
    subject:   question.subject,
    topic:     question.topic,
  })

  const masteryState = currentMastery || {
    score:                0,
    difficulty:           2,
    consecutiveCorrect:   0,
    consecutiveIncorrect: 0,
    totalAttempts:        0,
    correctAttempts:      0,
  }

  const newMastery = computeMasteryUpdate(
    masteryState,
    markingResult.isCorrect,
    markingResult.marksAwarded,
    markingResult.marksAvailable
  )

  // Upsert the mastery profile
  await MasteryProfile.findOneAndUpdate(
    {
      studentId: req.user._id,
      subject:   question.subject,
      topic:     question.topic,
    },
    {
      $set: {
        examType:             question.examType,
        score:                newMastery.score,
        difficulty:           newMastery.difficulty,
        consecutiveCorrect:   newMastery.consecutiveCorrect,
        consecutiveIncorrect: newMastery.consecutiveIncorrect,
        lastPracticed:        new Date(),
      },
      $inc: {
        totalAttempts:   1,
        correctAttempts: markingResult.isCorrect ? 1 : 0,
      },
    },
    { upsert: true, new: true }
  )

  // ── Update user totals ─────────────────────────────────────
  await User.findByIdAndUpdate(req.user._id, {
    $inc: {
      totalQuestionsAnswered: 1,
      totalCorrect:           markingResult.isCorrect ? 1 : 0,
    },
    lastActive: new Date(),
  })

  res.json({
    success: true,
    result: {
      ...markingResult,
      questionId,
      topic:         question.topic,
      subject:       question.subject,
      correctAnswer: question.type === 'MCQ' ? question.correctOption : null,
      masteryUpdate: {
        topic:        question.topic,
        oldScore:     masteryState.score,
        newScore:     newMastery.score,
        oldDifficulty: masteryState.difficulty,
        newDifficulty: newMastery.difficulty,
      },
    },
  })
})

// ── POST /api/practice/explain ─────────────────────────────────
// Student requests an AI explanation for a question they answered.
// Called on demand — not automatically after every answer.
export const getExplanation = asyncHandler(async (req, res) => {
  const { questionId, studentAnswer, isCorrect } = req.body

  const question = await Question.findById(questionId)
  if (!question) throw new AppError('Question not found', 404)

  const explanation = await generateExplanation(
    question,
    studentAnswer,
    isCorrect,
    question.subject
  )

  res.json({ success: true, explanation })
})

// ── POST /api/practice/session ─────────────────────────────────
// Saves the completed session to MongoDB at the end of practice.
// Called once when student finishes or exits a session.
export const saveSession = asyncHandler(async (req, res) => {
  const {
    subject,
    topic,
    examType,
    questions,
    totalMarks,
    availableMarks,
    duration,
    masteryUpdates,
  } = req.body

  const accuracy = availableMarks > 0
    ? Math.round((totalMarks / availableMarks) * 100)
    : 0

  const gradeInfo = calculateWAECGrade(totalMarks, availableMarks)

  const session = await Session.create({
    studentId:     req.user._id,
    sessionType:   'practice',
    subject,
    topic:         topic || 'Mixed',
    examType:      examType || 'WASSCE',
    questions:     questions || [],
    totalMarks:    totalMarks || 0,
    availableMarks: availableMarks || 0,
    accuracy,
    duration:      duration || 0,
    masteryUpdates: masteryUpdates || [],
    waecGrade:     gradeInfo.grade,
  })

  res.status(201).json({
    success:   true,
    message:   'Session saved',
    sessionId: session._id,
    accuracy,
    grade:     gradeInfo,
  })
})

// ── GET /api/practice/mastery ──────────────────────────────────
// Returns the student's full mastery profile for a subject.
// Used by the dashboard analytics and practice topic picker.
export const getMasteryProfile = asyncHandler(async (req, res) => {
  const { subject, examType = 'WASSCE' } = req.query
  if (!subject) throw new AppError('Subject is required', 400)

  const profiles = await MasteryProfile.find({
    studentId: req.user._id,
    subject,
    examType,
  }).lean()

  // Calculate overall subject mastery as average of topic scores
  const overallScore = profiles.length > 0
    ? Math.round(profiles.reduce((sum, p) => sum + p.score, 0) / profiles.length)
    : 0

  res.json({
    success: true,
    subject,
    overallScore,
    topicsAttempted: profiles.length,
    profiles,
  })
})

// ── GET /api/practice/sessions ─────────────────────────────────
// Returns a student's recent practice sessions for analytics.
export const getRecentSessions = asyncHandler(async (req, res) => {
  const { limit = 10, subject } = req.query

  const filter = { studentId: req.user._id, sessionType: 'practice' }
  if (subject) filter.subject = subject

  const sessions = await Session.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .select('subject topic accuracy totalMarks availableMarks duration waecGrade createdAt')
    .lean()

  res.json({ success: true, sessions })
})