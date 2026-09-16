import mongoose from 'mongoose'

// ── Class ────────────────────────────────────────────────────────
// A teacher's roster for one subject. Students join themselves via
// `joinCode` (entered in Settings) — no admin step involved. A student
// can belong to classes from multiple teachers/subjects; a teacher can
// run multiple classes.
const classSchema = new mongoose.Schema(
  {
    teacherId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    name:     { type: String, required: true, trim: true },
    subject:  { type: String, required: true },
    examType: { type: String, enum: ['WASSCE', 'BECE'], default: 'WASSCE' },

    // Short, shareable code — e.g. "MATH-7K2Q". Generated at creation
    // time by the controller (with a uniqueness retry loop), not here,
    // so creation failures are easy to retry without a pre-save hook
    // silently masking a collision.
    joinCode: {
      type:     String,
      required: true,
      unique:   true,
      uppercase: true,
      trim:     true,
    },

    studentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    }],
  },
  { timestamps: true }
)

classSchema.index({ teacherId: 1, createdAt: -1 })

const Class = mongoose.model('Class', classSchema)
export default Class
