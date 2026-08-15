import mongoose from 'mongoose'

// ── Shape of one question in the generated paper ───────────────
const examQuestionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Question',
  },
  section:        String,   // 'A', 'B', 'C'
  type:           String,   // 'MCQ', 'Structured', 'Essay'
  questionNumber: Number,
  questionText:   String,
  options:        [String], // MCQ only
  correctOption:  String,   // MCQ only
  modelAnswer:    String,
  marks:          Number,
  topic:          String,
  parts: [{
    part:   String,
    text:   String,
    marks:  Number,
    answer: String,
  }],

  // Student's submitted answer
  studentAnswer:  { type: String, default: '' },

  // Marking result — populated after submission
  marksAwarded:   { type: Number, default: null },
  isCorrect:      { type: Boolean, default: null },
  aiFeedback:     { type: String,  default: '' },
  partResults: [{
    part:           String,
    marksAwarded:   Number,
    marksAvailable: Number,
    feedback:       String,
  }],
}, { _id: false })

// ── Main MockExam schema ───────────────────────────────────────
const mockExamSchema = new mongoose.Schema(
  {
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    subject:  { type: String, required: true },
    examType: { type: String, enum: ['WASSCE', 'BECE'], default: 'WASSCE' },
    year:     { type: Number, default: () => new Date().getFullYear() },

    // ── Exam status ────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['generated', 'in_progress', 'submitted', 'marked'],
      default: 'generated',
    },

    // ── The three sections ─────────────────────────────────────
    sectionA: [examQuestionSchema],   // MCQ — 40 questions, 1 mark each
    sectionB: [examQuestionSchema],   // Structured — 4 questions, 10 marks each
    sectionC: [examQuestionSchema],   // Essay — 2 questions, answer 1, 20 marks

    // ── Timing ─────────────────────────────────────────────────
    timeAllowedMinutes: { type: Number, default: 160 },  // 2hrs 40mins
    startedAt:          { type: Date, default: null },
    submittedAt:        { type: Date, default: null },
    timeSpentSeconds:   { type: Number, default: 0 },

    // ── Results — populated after AI marking ───────────────────
    results: {
      sectionAMarks:   { type: Number, default: 0 },
      sectionBMarks:   { type: Number, default: 0 },
      sectionCMarks:   { type: Number, default: 0 },
      totalMarks:      { type: Number, default: 0 },
      availableMarks:  { type: Number, default: 100 },
      percent:         { type: Number, default: 0 },
      waecGrade:       { type: String, default: '' },
      gradeLabel:      { type: String, default: '' },
      examinerComment: { type: String, default: '' },
    },

    // ── Physical exam entry (Option 5 — Hybrid Admin Dashboard) ─
    isPhysicalEntry: { type: Boolean, default: false },
    enteredByAdmin:  {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },
  },
  { timestamps: true }
)

mockExamSchema.index({ studentId: 1, createdAt: -1 })
mockExamSchema.index({ studentId: 1, subject: 1, status: 1 })

const MockExam = mongoose.model('MockExam', mockExamSchema)
export default MockExam