import mongoose from 'mongoose'

// ── Shape of one answered question within a session ────────────
const questionResultSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  type:          String,      // 'MCQ', 'Structured', 'Essay'
  topic:         String,
  difficulty:    Number,

  // What the student submitted
  studentAnswer: String,

  // MCQ fields
  correctAnswer: String,
  isCorrect:     Boolean,

  // Marks
  marksAwarded:   { type: Number, default: 0 },
  marksAvailable: { type: Number, default: 1 },

  // Timing
  timeTaken: Number,          // seconds spent on this question

  // AI explanation — only populated if student requested it
  aiExplanation: {
    type:    String,
    default: '',
  },

  // For structured/essay — per-part breakdown from AI marking
  partResults: [
    {
      part:          String,
      marksAwarded:  Number,
      marksAvailable: Number,
      feedback:      String,
    },
  ],
}, { _id: false })

// ── Mastery change record ──────────────────────────────────────
// Tracks which topics changed score during this session.
const masteryUpdateSchema = new mongoose.Schema({
  topic:      String,
  oldScore:   Number,
  newScore:   Number,
  oldDifficulty: Number,
  newDifficulty: Number,
}, { _id: false })

// ── Main session schema ────────────────────────────────────────
const sessionSchema = new mongoose.Schema(
  {
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    sessionType: {
      type:    String,
      enum:    ['practice', 'mock'],
      default: 'practice',
    },

    subject:  { type: String, required: true },
    topic:    { type: String, default: 'Mixed' },
    examType: { type: String, enum: ['WASSCE', 'BECE'], default: 'WASSCE' },

    // All question results for this session
    questions: [questionResultSchema],

    // Aggregate scores
    totalMarks:     { type: Number, default: 0 },
    availableMarks: { type: Number, default: 0 },
    accuracy:       { type: Number, default: 0 },  // 0-100 percent
    duration:       { type: Number, default: 0 },  // total seconds

    // Which topics changed mastery level
    masteryUpdates: [masteryUpdateSchema],

    // WAEC grade equivalent for mock sessions
    waecGrade: { type: String, default: '' },
  },
  { timestamps: true }
)

// ── Index for fast dashboard queries ──────────────────────────
sessionSchema.index({ studentId: 1, createdAt: -1 })
sessionSchema.index({ studentId: 1, subject: 1 })

const Session = mongoose.model('Session', sessionSchema)
export default Session