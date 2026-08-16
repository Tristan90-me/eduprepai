import User from '../models/User.model.js'
import Session from '../models/Session.model.js'
import MockExam from '../models/MockExam.model.js'

// ── Badge definitions ──────────────────────────────────────────
// Each badge has an id, name, description, icon (emoji), and
// a check() function that returns true if the student earns it.
// check() receives: { user, sessions, mockExams, masteryProfiles }
export const BADGE_DEFINITIONS = [

  // ── Getting started ────────────────────────────────────────
  {
    id:          'first_practice',
    name:        'First Step',
    description: 'Completed your first practice session',
    icon:        '🎯',
    colour:      'teal',
    check:       ({ sessions }) => sessions.length >= 1,
  },
  {
    id:          'first_mock',
    name:        'Trial Run',
    description: 'Completed your first mock examination',
    icon:        '📝',
    colour:      'blue',
    check:       ({ mockExams }) => mockExams.length >= 1,
  },

  // ── Accuracy milestones ────────────────────────────────────
  {
    id:          'accuracy_60',
    name:        'On Track',
    description: 'Achieved 60% overall accuracy',
    icon:        '📈',
    colour:      'amber',
    check:       ({ user }) => {
      const acc = user.totalQuestionsAnswered > 0
        ? (user.totalCorrect / user.totalQuestionsAnswered) * 100 : 0
      return acc >= 60
    },
  },
  {
    id:          'accuracy_75',
    name:        'Sharp Mind',
    description: 'Achieved 75% overall accuracy',
    icon:        '⚡',
    colour:      'amber',
    check:       ({ user }) => {
      const acc = user.totalQuestionsAnswered > 0
        ? (user.totalCorrect / user.totalQuestionsAnswered) * 100 : 0
      return acc >= 75
    },
  },
  {
    id:          'accuracy_90',
    name:        'Excellence',
    description: 'Achieved 90% overall accuracy — outstanding!',
    icon:        '🌟',
    colour:      'gold',
    check:       ({ user }) => {
      const acc = user.totalQuestionsAnswered > 0
        ? (user.totalCorrect / user.totalQuestionsAnswered) * 100 : 0
      return acc >= 90
    },
  },

  // ── Volume milestones ──────────────────────────────────────
  {
    id:          'q_50',
    name:        'Getting Started',
    description: 'Answered 50 questions',
    icon:        '💪',
    colour:      'green',
    check:       ({ user }) => user.totalQuestionsAnswered >= 50,
  },
  {
    id:          'q_200',
    name:        'Committed',
    description: 'Answered 200 questions',
    icon:        '🔥',
    colour:      'orange',
    check:       ({ user }) => user.totalQuestionsAnswered >= 200,
  },
  {
    id:          'q_500',
    name:        'Dedicated',
    description: 'Answered 500 questions',
    icon:        '🏆',
    colour:      'gold',
    check:       ({ user }) => user.totalQuestionsAnswered >= 500,
  },
  {
    id:          'q_1000',
    name:        'Champion',
    description: 'Answered 1,000 questions — you are serious!',
    icon:        '👑',
    colour:      'purple',
    check:       ({ user }) => user.totalQuestionsAnswered >= 1000,
  },

  // ── Streak milestones ──────────────────────────────────────
  {
    id:          'streak_3',
    name:        'Consistent',
    description: 'Studied 3 days in a row',
    icon:        '🔥',
    colour:      'amber',
    check:       ({ user }) => (user.streak || 0) >= 3,
  },
  {
    id:          'streak_7',
    name:        'Week Warrior',
    description: 'Studied 7 days in a row — a full week!',
    icon:        '📅',
    colour:      'orange',
    check:       ({ user }) => (user.streak || 0) >= 7,
  },
  {
    id:          'streak_30',
    name:        'Unstoppable',
    description: 'Studied 30 days in a row — incredible discipline',
    icon:        '⚡',
    colour:      'gold',
    check:       ({ user }) => (user.streak || 0) >= 30,
  },

  // ── Mock exam performance ──────────────────────────────────
  {
    id:          'mock_pass',
    name:        'Paper Passed',
    description: 'Passed a mock examination (C6 or above)',
    icon:        '✅',
    colour:      'green',
    check:       ({ mockExams }) =>
      mockExams.some(e => ['A1','B2','B3','C4','C5','C6'].includes(e.results?.waecGrade)),
  },
  {
    id:          'mock_b3',
    name:        'Good Grade',
    description: 'Achieved B3 or above in a mock examination',
    icon:        '🎖️',
    colour:      'blue',
    check:       ({ mockExams }) =>
      mockExams.some(e => ['A1','B2','B3'].includes(e.results?.waecGrade)),
  },
  {
    id:          'mock_a1',
    name:        'Distinction',
    description: 'Achieved A1 in a mock examination — exceptional!',
    icon:        '🥇',
    colour:      'gold',
    check:       ({ mockExams }) =>
      mockExams.some(e => e.results?.waecGrade === 'A1'),
  },
  {
    id:          'mock_5',
    name:        'Mock Master',
    description: 'Completed 5 mock examinations',
    icon:        '📋',
    colour:      'purple',
    check:       ({ mockExams }) => mockExams.length >= 5,
  },
]

// ── checkAndAwardBadges ────────────────────────────────────────
// Runs after any significant event (session complete, mock marked).
// Returns array of newly awarded badge IDs — used for UI notification.
export const checkAndAwardBadges = async (userId) => {
  const [user, sessions, mockExams] = await Promise.all([
    User.findById(userId).lean(),
    Session.find({ studentId: userId, sessionType: 'practice' }).lean(),
    MockExam.find({ studentId: userId, status: 'marked' }).lean(),
  ])

  if (!user) return []

  const currentBadges = new Set(user.badges || [])
  const newlyAwarded  = []

  for (const badge of BADGE_DEFINITIONS) {
    // Skip badges the student already has
    if (currentBadges.has(badge.id)) continue

    // Run the eligibility check
    const earned = badge.check({ user, sessions, mockExams })

    if (earned) {
      currentBadges.add(badge.id)
      newlyAwarded.push(badge.id)
    }
  }

  // Only write to DB if something changed
  if (newlyAwarded.length > 0) {
    await User.findByIdAndUpdate(userId, {
      badges: [...currentBadges],
    })
  }

  return newlyAwarded
}

// ── updateStreak ───────────────────────────────────────────────
// Called after each practice session or mock exam.
// Increments streak if student has been active today or yesterday.
// Resets to 1 if the last activity was more than 1 day ago.
export const updateStreak = async (userId) => {
  const user = await User.findById(userId).select('streak lastActive').lean()
  if (!user) return 0

  const now       = new Date()
  const lastActive = user.lastActive ? new Date(user.lastActive) : null
  let newStreak   = user.streak || 0

  if (lastActive) {
    const daysSince = Math.floor(
      (now.setHours(0,0,0,0) - lastActive.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)
    )

    if (daysSince === 0) {
      // Already active today — streak unchanged
    } else if (daysSince === 1) {
      // Active yesterday — increment streak
      newStreak += 1
    } else {
      // Gap of more than 1 day — reset streak
      newStreak = 1
    }
  } else {
    newStreak = 1
  }

  await User.findByIdAndUpdate(userId, {
    streak:     newStreak,
    lastActive: new Date(),
  })

  return newStreak
}

// ── getBadgeDetails ────────────────────────────────────────────
// Returns full badge definition objects for a list of badge IDs.
export const getBadgeDetails = (badgeIds = []) => {
  return BADGE_DEFINITIONS.filter(b => badgeIds.includes(b.id))
}

// ── getAllBadgesWithStatus ─────────────────────────────────────
// Returns all badges with earned/not-earned status for a student.
// Used by the settings and profile pages.
export const getAllBadgesWithStatus = (earnedBadgeIds = []) => {
  const earned = new Set(earnedBadgeIds)
  return BADGE_DEFINITIONS.map(b => ({
    ...b,
    earned: earned.has(b.id),
  }))
}