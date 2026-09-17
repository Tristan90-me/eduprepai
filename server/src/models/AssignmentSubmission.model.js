import mongoose from 'mongoose'

// One answer, indexed to line up by position with the parent
// Assignment's `questions` array — not a duplicated question snapshot.
const assignmentAnswerSchema = new mongoose.Schema({
  studentAnswer: { type: String, default: '' },
  marksAwarded:  { type: Number, default: null },
  isCorrect:     { type: Boolean, default: null },
  aiFeedback:    { type: String, default: '' },
  // Set when this answer came from a photo transcription rather than
  // being typed — kept true even if the student edits the text
  // afterward. Any submission with at least one scanned answer routes
  // to teacher review instead of instant marking (see submitSubmission).
  wasScanned:    { type: Boolean, default: false },
  partResults: [{
    part:           String,
    marksAwarded:   Number,
    marksAvailable: Number,
    feedback:       String,
  }],
}, { _id: false })

// ── AssignmentSubmission ─────────────────────────────────────────
// One per student per assignment, created eagerly for every student
// in the class at assignment-creation time — so a teacher sees
// "0/25 submitted" immediately, and a student's pending-assignment
// badge count is a simple query with no join needed.
const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Assignment',
      required: true,
      index:    true,
    },
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    status: {
      type:    String,
      // 'pending_review' sits between 'submitted' and 'marked' — only
      // reached when at least one answer was photo-scanned (see
      // submitSubmission); typed/MCQ-only submissions skip straight to
      // 'marked' with instant AI marking, unchanged from Phase 1.
      enum:    ['assigned', 'in_progress', 'submitted', 'pending_review', 'marked'],
      default: 'assigned',
    },

    answers: [assignmentAnswerSchema],

    totalMarks:     { type: Number, default: 0 },
    availableMarks: { type: Number, default: 0 },
    percent:        { type: Number, default: 0 },

    submittedAt: { type: Date, default: null },
    markedAt:    { type: Date, default: null },
  },
  { timestamps: true }
)

assignmentSubmissionSchema.index({ studentId: 1, status: 1 })
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true })

const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema)
export default AssignmentSubmission
