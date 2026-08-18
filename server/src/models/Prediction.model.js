import mongoose from 'mongoose'

// ── Shape of one predicted topic ──────────────────────────────
const topicPredictionSchema = new mongoose.Schema({
  topic:          String,
  confidence:     Number,        // 0–100
  tier:           String,        // 'hot', 'warm', 'watch'
  trendDirection: Number,        // -1, 0, 1
  yearlyFrequency: [{
    year:  Number,
    count: Number,
  }],
  // questionType, not "type" — a field literally named `type` on a
  // nested object is misparsed by Mongoose as that object's own
  // SchemaType declaration rather than a sibling data field.
  sectionForecast: {
    questionType:  String,
    section:       String,
    expectedMarks: Number,
    confidence:    Number,
  },
  clusters:        [String],     // related topic names
  difficultyTrend: String,
  yearsAppeared:   [Number],
  latestYear:      Number,
  totalQuestions:  Number,
  // AI-generated fields
  aiReasoning:     String,       // Claude/Gemini human-readable explanation
  examinerStyleHint: String,     // phrasing pattern hint
}, { _id: false })

const predictionSchema = new mongoose.Schema(
  {
    subject:   {
      type:     String,
      required: true,
    },
    examType:  {
      type:     String,
      enum:     ['WASSCE', 'BECE'],
      required: true,
    },

    predictions: [topicPredictionSchema],

    // ── Cache management ───────────────────────────────────────
    // generatedAt tells us when this cache entry was created.
    // Controllers check this before deciding to rerun the engine.
    generatedAt: {
      type:    Date,
      default: Date.now,
    },

    // ── Accuracy log ───────────────────────────────────────────
    // After a real exam, admin can log which topics actually appeared.
    // This builds a self-improving feedback loop over time.
    accuracyLog: [{
      examYear:         Number,
      predictedTopics:  [String],
      actualTopics:     [String],
      accuracyPercent:  Number,
      loggedAt:         Date,
    }],

    totalQuestionsAnalysed: Number,
    runBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },
  },
  { timestamps: true }
)

// ── Compound index ─────────────────────────────────────────────
// One prediction document per subject+examType combination.
predictionSchema.index({ subject: 1, examType: 1 }, { unique: true })

const Prediction = mongoose.model('Prediction', predictionSchema)
export default Prediction