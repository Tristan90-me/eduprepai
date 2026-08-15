import mongoose from 'mongoose'

// ── MasteryProfile ─────────────────────────────────────────────
// One document per student per subject per topic.
// This is the core of the adaptive difficulty engine.
// The score (0-100) and difficulty (1-5) determine which
// questions get served next time the student practises.
const masteryProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    subject:  { type: String, required: true },
    examType: { type: String, enum: ['WASSCE', 'BECE'], default: 'WASSCE' },
    topic:    { type: String, required: true },

    // ── The core adaptive signals ──────────────────────────────
    score: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },

    // Current serving difficulty level
    // Starts at 2 (Standard) — not Foundation, to avoid feeling condescending
    difficulty: {
      type:    Number,
      default: 2,
      min:     1,
      max:     5,
    },

    // ── Performance tracking ───────────────────────────────────
    totalAttempts:   { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },

    // Consecutive streak tracking — drives difficulty changes
    consecutiveCorrect:   { type: Number, default: 0 },
    consecutiveIncorrect: { type: Number, default: 0 },

    lastPracticed: { type: Date, default: null },
  },
  { timestamps: true }
)

// ── Compound index: one profile per student+subject+topic ──────
masteryProfileSchema.index(
  { studentId: 1, subject: 1, topic: 1 },
  { unique: true }
)

masteryProfileSchema.index({ studentId: 1, subject: 1 })

const MasteryProfile = mongoose.model('MasteryProfile', masteryProfileSchema)
export default MasteryProfile