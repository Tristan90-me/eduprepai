import mongoose from 'mongoose'

// ── Shape of one question in an assignment ─────────────────────
// Mirrors MockExam.model.js's examQuestionSchema fields, minus the
// per-student answer/marking fields — many students share one
// assignment (unlike a mock exam, where each paper is already unique
// per student), so answers live on AssignmentSubmission instead,
// indexed to line up with this array by position.
const assignmentQuestionSchema = new mongoose.Schema({
  type:          String,   // 'MCQ', 'Structured', 'Essay'
  questionText:  String,
  options:       [String], // MCQ only
  correctOption: String,   // MCQ only
  modelAnswer:   String,
  marks:         Number,
  topic:         String,
  hasImage:      { type: Boolean, default: false },
  imageData:     { type: String,  default: '' },
  parts: [{
    part:   String,
    text:   String,
    marks:  Number,
    answer: String,
  }],
}, { _id: false })

// ── Assignment ───────────────────────────────────────────────────
// A teacher-created question set targeted at one Class. No WAEC letter
// grade is computed for these — this is remedial/practice work, not a
// real paper, so results only ever show marks/percent/feedback.
const assignmentSchema = new mongoose.Schema(
  {
    classId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Class',
      required: true,
      index:    true,
    },
    teacherId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    title:    { type: String, required: true, trim: true },
    subject:  { type: String, required: true },
    examType: { type: String, enum: ['WASSCE', 'BECE'], default: 'WASSCE' },
    dueDate:  { type: Date, default: null },

    questions: [assignmentQuestionSchema],
  },
  { timestamps: true }
)

assignmentSchema.index({ classId: 1, createdAt: -1 })

const Assignment = mongoose.model('Assignment', assignmentSchema)
export default Assignment
