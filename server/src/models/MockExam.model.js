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
  hasImage:       { type: Boolean, default: false },
  imageData:      { type: String,  default: '' },
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

  // Cached AI explanation, generated on demand after marking.
  // Shape varies: { kind: 'mcq', ... } or { kind: 'checklist', ... } —
  // see generateExplanation / generateMarkingChecklist in marking.utils.js.
  aiExplanation: { type: mongoose.Schema.Types.Mixed, default: null },
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
    sectionB: [examQuestionSchema],   // Structured — count/marks vary by subject, see mockGenerator.utils.js
    sectionC: [examQuestionSchema],   // Essay — count/marks vary by subject; answer sectionCAnswerCount of them

    // How many of the offered sectionC questions the student must
    // answer — 1 for the generic structure, but e.g. BECE Computing
    // offers 4 and expects 3 answered. Set at generation time from
    // getPaperStructure() so the exam-taking UI knows before marking.
    sectionCAnswerCount: { type: Number, default: 1 },

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
      // "Out of" totals for each section on this specific exam — not
      // every subject uses the generic 40/40/20 split (e.g. BECE
      // Computing is 40/24/36), so displays must read these instead
      // of hardcoding a denominator.
      sectionATotal:   { type: Number, default: 40 },
      sectionBTotal:   { type: Number, default: 40 },
      sectionCTotal:   { type: Number, default: 20 },
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