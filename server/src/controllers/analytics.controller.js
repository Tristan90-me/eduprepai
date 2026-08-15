import Session        from '../models/Session.model.js'
import MasteryProfile from '../models/MasteryProfile.model.js'
import MockExam       from '../models/MockExam.model.js'
import User           from '../models/User.model.js'
import { asyncHandler } from '../middleware/error.middleware.js'

// ── GET /api/analytics/overview ───────────────────────────────
// Student's full performance overview for the analytics dashboard.
export const getOverview = asyncHandler(async (req, res) => {
  const studentId = req.user._id

  // ── Parallel data fetch ────────────────────────────────────
  const [
    recentSessions,
    masteryProfiles,
    mockExams,
    user,
  ] = await Promise.all([
    Session.find({ studentId, sessionType: 'practice' })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('subject topic accuracy totalMarks availableMarks duration waecGrade createdAt')
      .lean(),

    MasteryProfile.find({ studentId })
      .sort({ score: -1 })
      .lean(),

    MockExam.find({ studentId, status: 'marked' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('subject examType results createdAt submittedAt timeSpentSeconds')
      .lean(),

    User.findById(studentId)
      .select('totalQuestionsAnswered totalCorrect streak subjects badges createdAt')
      .lean(),
  ])

  // ── Overall accuracy ───────────────────────────────────────
  const overallAccuracy = user.totalQuestionsAnswered > 0
    ? Math.round((user.totalCorrect / user.totalQuestionsAnswered) * 100)
    : 0

  // ── Weekly accuracy trend (last 7 days) ───────────────────
  const weeklyTrend = buildWeeklyTrend(recentSessions)

  // ── Subject performance breakdown ─────────────────────────
  const subjectBreakdown = buildSubjectBreakdown(recentSessions, masteryProfiles)

  // ── Topic mastery heatmap data ─────────────────────────────
  const masteryHeatmap = masteryProfiles.map(m => ({
    subject:    m.subject,
    topic:      m.topic,
    score:      m.score,
    difficulty: m.difficulty,
    attempts:   m.totalAttempts,
    lastPracticed: m.lastPracticed,
  }))

  // ── Mock exam history ──────────────────────────────────────
  const mockHistory = mockExams.map(e => ({
    subject:   e.subject,
    examType:  e.examType,
    grade:     e.results?.waecGrade,
    percent:   e.results?.percent,
    totalMarks: e.results?.totalMarks,
    date:      e.createdAt,
    sectionA:  e.results?.sectionAMarks,
    sectionB:  e.results?.sectionBMarks,
    sectionC:  e.results?.sectionCMarks,
  }))

  // ── Curriculum coverage ────────────────────────────────────
  // Percentage of topics attempted per subject
  const coverageBySubject = buildCoverageStats(masteryProfiles)

  // ── Streak calendar (last 30 days) ────────────────────────
  const activityCalendar = buildActivityCalendar(recentSessions)

  res.json({
    success: true,
    overview: {
      totalQuestions:  user.totalQuestionsAnswered || 0,
      totalCorrect:    user.totalCorrect           || 0,
      overallAccuracy,
      streak:          user.streak                 || 0,
      badges:          user.badges                 || [],
      memberSince:     user.createdAt,
    },
    weeklyTrend,
    subjectBreakdown,
    masteryHeatmap,
    mockHistory,
    coverageBySubject,
    activityCalendar,
    recentSessions: recentSessions.slice(0, 10),
  })
})

// ── GET /api/analytics/leaderboard ────────────────────────────
// Global leaderboard — top students by total questions answered
// and accuracy. Anonymised to show first name only.
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { examType = 'WASSCE', limit = 20 } = req.query

  const leaderboard = await User.find({
    role: 'student',
    totalQuestionsAnswered: { $gt: 0 },
  })
  .sort({ totalQuestionsAnswered: -1, totalCorrect: -1 })
  .limit(Number(limit))
  .select('fullName school examType totalQuestionsAnswered totalCorrect streak badges')
  .lean()

  const ranked = leaderboard.map((u, idx) => ({
    rank:      idx + 1,
    name:      u.fullName?.split(' ')[0] + ' ' + (u.fullName?.split(' ')[1]?.charAt(0) || '') + '.',
    school:    u.school || 'Unknown school',
    examType:  u.examType,
    questions: u.totalQuestionsAnswered,
    accuracy:  u.totalQuestionsAnswered > 0
      ? Math.round((u.totalCorrect / u.totalQuestionsAnswered) * 100)
      : 0,
    streak:    u.streak || 0,
    badges:    u.badges?.length || 0,
    isCurrentUser: u._id.toString() === req.user._id.toString(),
  }))

  // Find current user's position if not in top N
  const userInList = ranked.find(u => u.isCurrentUser)
  let currentUserRank = null

  if (!userInList) {
    const betterCount = await User.countDocuments({
      role: 'student',
      totalQuestionsAnswered: { $gt: req.user.totalQuestionsAnswered || 0 },
    })
    currentUserRank = betterCount + 1
  }

  res.json({
    success: true,
    leaderboard: ranked,
    currentUserRank: userInList ? userInList.rank : currentUserRank,
  })
})

// ── Helper: build weekly accuracy trend ───────────────────────
const buildWeeklyTrend = (sessions) => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const daySessions = sessions.filter(s => {
      const sDate = new Date(s.createdAt).toISOString().split('T')[0]
      return sDate === dateStr
    })

    const accuracy = daySessions.length > 0
      ? Math.round(daySessions.reduce((sum, s) => sum + s.accuracy, 0) / daySessions.length)
      : null

    days.push({
      date:     dateStr,
      day:      date.toLocaleDateString('en-GB', { weekday: 'short' }),
      accuracy,
      sessions: daySessions.length,
    })
  }
  return days
}

// ── Helper: subject performance breakdown ──────────────────────
const buildSubjectBreakdown = (sessions, masteryProfiles) => {
  const subjectMap = {}

  sessions.forEach(s => {
    if (!subjectMap[s.subject]) {
      subjectMap[s.subject] = { subject: s.subject, sessions: 0, totalAccuracy: 0, questions: 0 }
    }
    subjectMap[s.subject].sessions++
    subjectMap[s.subject].totalAccuracy += s.accuracy
    subjectMap[s.subject].questions     += s.availableMarks || 0
  })

  // Add mastery data per subject
  masteryProfiles.forEach(m => {
    if (!subjectMap[m.subject]) {
      subjectMap[m.subject] = { subject: m.subject, sessions: 0, totalAccuracy: 0, questions: 0 }
    }
  })

  return Object.values(subjectMap).map(s => ({
    subject:         s.subject,
    sessions:        s.sessions,
    averageAccuracy: s.sessions > 0 ? Math.round(s.totalAccuracy / s.sessions) : 0,
    topicsAttempted: masteryProfiles.filter(m => m.subject === s.subject).length,
    avgMastery:      (() => {
      const topicProfiles = masteryProfiles.filter(m => m.subject === s.subject)
      return topicProfiles.length > 0
        ? Math.round(topicProfiles.reduce((sum, m) => sum + m.score, 0) / topicProfiles.length)
        : 0
    })(),
  }))
}

// ── Helper: coverage stats ─────────────────────────────────────
const buildCoverageStats = (masteryProfiles) => {
  const subjectMap = {}

  masteryProfiles.forEach(m => {
    if (!subjectMap[m.subject]) {
      subjectMap[m.subject] = { attempted: 0, mastered: 0 }
    }
    subjectMap[m.subject].attempted++
    if (m.score >= 70) subjectMap[m.subject].mastered++
  })

  return Object.entries(subjectMap).map(([subject, stats]) => ({
    subject,
    topicsAttempted: stats.attempted,
    topicsMastered:  stats.mastered,
  }))
}

// ── Helper: activity calendar (heatmap) ───────────────────────
const buildActivityCalendar = (sessions) => {
  const map = {}
  sessions.forEach(s => {
    const date = new Date(s.createdAt).toISOString().split('T')[0]
    if (!map[date]) map[date] = 0
    map[date]++
  })
  return map  // { 'YYYY-MM-DD': sessionCount }
}