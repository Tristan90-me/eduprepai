import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    // ── Identity & classification ──────────────────────────────
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: [
        'Mathematics',
        'English Language',
        'Integrated Science',
        'Social Studies',
        'Physics',
        'Chemistry',
        'Biology',
        'Economics',
        'Elective Mathematics',
        'Geography',
        'French',
        'Computing',
        'Religious & Moral Education',
        'Creative Arts And Design',
        'Ghanaian Language',
        'Career Technology',
      ],
    },

    examType: {
      type: String,
      required: true,
      enum: ['WASSCE', 'BECE'],
    },

    year: {
      type: Number,
      required: [true, 'Examination year is required'],
      min: [2010, 'Year must be 2010 or later'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
    },

    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      // e.g. "Algebra", "Organic Chemistry", "Essay Writing"
    },

    subtopic: {
      type: String,
      trim: true,
      default: '',
      // e.g. "Quadratic Equations", "Functional Groups"
    },

    syllabusReference: {
      type: String,
      trim: true,
      default: '',
      // e.g. "WAEC Math 3.2.1" — links question to curriculum
    },

    // ── Question type & difficulty ─────────────────────────────
    type: {
      type: String,
      required: true,
      enum: ['MCQ', 'Structured', 'Essay'],
    },

    difficulty: {
      type: Number,
      required: true,
      min: 1,   // 1 = Foundation
      max: 5,   // 5 = Examiner level
      // 1=Foundation, 2=Standard, 3=Intermediate, 4=Advanced, 5=Examiner
    },

    marks: {
      type: Number,
      required: [true, 'Mark allocation is required'],
      min: 1,
    },

    section: {
      type: String,
      enum: ['A', 'B', 'C'],
      // A = MCQ section, B = Structured, C = Essay
    },

    // ── Question content ───────────────────────────────────────
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },

    // MCQ only — the four answer options
    options: {
      type: [String],
      default: [],
      validate: {
        validator: function (val) {
          // MCQ must have exactly 4 options; other types have none
          if (this.type === 'MCQ') return val.length === 4
          return true
        },
        message: 'MCQ questions must have exactly 4 options',
      },
    },

    // MCQ only — the correct option (e.g. "A", "B", "C", "D")
    correctOption: {
      type: String,
      enum: ['A', 'B', 'C', 'D', ''],
      default: '',
    },

    // Structured/Essay — the model answer used for marking
    modelAnswer: {
      type: String,
      default: '',
    },

    // AI-generated explanation (populated on demand, not upfront)
    explanation: {
      type: String,
      default: '',
    },

    // ── Structured question parts (Section B) ─────────────────
    // e.g. [{ part: 'a', text: 'Define velocity', marks: 3 }]
    parts: [
      {
        part:      { type: String },   // 'a', 'b', 'c'
        text:      { type: String },
        marks:     { type: Number },
        answer:    { type: String },
      },
    ],

    // ── Metadata for prediction engine ─────────────────────────
    isActive: {
      type: Boolean,
      default: true,   // admins can deactivate without deleting
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

// ── Indexes for fast filtering ─────────────────────────────────
// These make queries like "all Math MCQs from 2019-2024" instant.
questionSchema.index({ subject: 1, topic: 1, year: 1 })
questionSchema.index({ subject: 1, type: 1, difficulty: 1 })
questionSchema.index({ examType: 1, subject: 1 })
questionSchema.index({ topic: 1, year: 1 })

const Question = mongoose.model('Question', questionSchema)
export default Question