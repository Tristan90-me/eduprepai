import { generateAIJSON } from '../utils/aiService.js'
import Question from '../models/Question.model.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'
import { PDFParse } from 'pdf-parse'
import { extractQuestionsWithVision } from '../utils/questionExtraction.utils.js'
import { getGroundingContext, formatGroundingBlock } from '../utils/curriculumGrounding.utils.js'

// ── POST /api/admin/generate-questions ─────────────────────────
// Gemini generates WAEC-style questions based on admin config.
// Returns a preview array — nothing is saved until admin approves.
export const generateQuestions = asyncHandler(async (req, res) => {
  const {
    subject,
    examType  = 'WASSCE',
    topic,
    subtopic  = '',
    year      = new Date().getFullYear(),
    difficulty = 3,
    type      = 'MCQ',
    count     = 5,         // how many questions to generate
    section,
  } = req.body

  // Validate count — keep AI calls manageable
  if (count < 1 || count > 20) {
    throw new AppError('Count must be between 1 and 20 questions per request', 400)
  }

  // ── Build section default based on type ─────────────────────
  const defaultSection = type === 'MCQ'        ? 'A'
                       : type === 'Structured' ? 'B'
                       : 'C'
  const resolvedSection = section || defaultSection

  // ── Difficulty label for the prompt ─────────────────────────
  const difficultyLabel = {
    1: 'Foundation — basic recall, simple definitions',
    2: 'Standard — straightforward application of concepts',
    3: 'Intermediate — multi-step problems, some analysis required',
    4: 'Advanced — complex application, evaluation, synthesis',
    5: 'Examiner — highest WAEC standard, sophisticated reasoning required',
  }[difficulty] || 'Intermediate'

  // ── Marks based on section ───────────────────────────────────
  const marksMap = { A: 1, B: 10, C: 20 }
  const marks    = marksMap[resolvedSection] || 1

  const systemPrompt = `You are a WAEC chief examiner with 20 years of experience 
setting ${examType} ${subject} examination papers in Ghana.
You write questions that exactly match the WAEC standard of setting — 
precise language, authentic Ghanaian context where relevant, 
correct mark allocations, and curriculum-aligned content.
Always respond with valid JSON only. No markdown. No explanation outside the JSON.`

  // Curriculum grounding — currently only populated for Computing;
  // resolves to null (no-op) for every other subject.
  const grounding = await getGroundingContext(subject, topic)

  const prompt = buildGenerationPrompt({
    subject, examType, topic, subtopic, year,
    difficulty, difficultyLabel, type,
    section: resolvedSection, marks, count,
  }) + formatGroundingBlock(grounding)

  // ── Call AI ──────────────────────────────────────────────────
  const generated = await generateAIJSON(prompt, systemPrompt)

  // ── Validate AI returned an array ───────────────────────────
  if (!Array.isArray(generated)) {
    throw new AppError('AI returned unexpected format. Please try again.', 500)
  }

  // ── Tag each question with metadata ─────────────────────────
  // These are previews — isAIGenerated flag tells admin they need review
  const previews = generated.map((q, i) => ({
    ...q,
    subject,
    examType,
    topic,
    subtopic,
    year:       Number(year),
    difficulty: Number(difficulty),
    type,
    section:    resolvedSection,
    marks,
    isAIGenerated: true,
    // AI-generated content is never real exam evidence, regardless of how
    // closely it mimics WAEC style — always 'practice', no admin choice.
    questionSource: 'practice',
    previewId:  `preview_${Date.now()}_${i}`, // temp ID for frontend tracking
  }))

  res.json({
    success:  true,
    message:  `${previews.length} questions generated — review before saving`,
    count:    previews.length,
    previews,
  })
})

// ── POST /api/admin/approve-questions ──────────────────────────
// Admin reviewed the previews and approved a subset.
// This is the only place questions actually get saved to MongoDB.
export const approveQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('No questions provided for approval', 400)
  }

  // Strip only the frontend-only preview ID — everything else (including
  // isAIGenerated and questionSource) came from the preview stage and must
  // be preserved as-is. This endpoint is shared by both the AI Generator
  // and PDF Extractor previews, so it must not assume a single origin —
  // it previously force-set isAIGenerated: true on every approval, which
  // silently mislabeled real PDF-extracted questions as AI-generated.
  const cleaned = questions.map(({ previewId, ...rest }) => ({
    ...rest,
    addedBy: req.user._id,
  }))

  const saved = await Question.insertMany(cleaned, { ordered: false })

  res.status(201).json({
    success: true,
    message: `${saved.length} questions saved to the question bank`,
    count:   saved.length,
  })
})

// ── POST /api/admin/extract-pdf ────────────────────────────────
// Receives a PDF buffer, extracts text, sends to AI for parsing.
// Returns structured question previews — same review flow as generation.
export const extractFromPDF = asyncHandler(async (req, res) => {
  // The PDF arrives as a base64 string from the frontend
  const { pdfBase64, subject, examType, year, questionSource = 'pastPaper' } = req.body

  if (!pdfBase64) throw new AppError('No PDF data received', 400)
  if (!subject)   throw new AppError('Subject is required', 400)

  // ── Decode base64 → Buffer ───────────────────────────────────
  const buffer = Buffer.from(pdfBase64, 'base64')

  // ── Extract raw text from PDF ────────────────────────────────
  let extractedText
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    extractedText = result.text

    if (!extractedText || extractedText.trim().length < 50) {
      throw new AppError(
        'Could not extract readable text from this PDF. ' +
        'The file may be a scanned image. Try a text-based PDF.',
        400
      )
    }
  } catch (err) {
    if (err.statusCode) throw err  // re-throw AppErrors
    throw new AppError('PDF parsing failed: ' + err.message, 400)
  } finally {
    await parser.destroy()
  }

  // ── Vision-based extraction: render pages, call AI, crop diagrams,
  // normalize topics — shared with the batch CLI extractor so both
  // stay in sync (questionExtraction.utils.js's extractQuestionsWithVision).
  let extracted
  try {
    extracted = await extractQuestionsWithVision({ buffer, text: extractedText, subject, examType, year })
  } catch (err) {
    throw new AppError(err.message, 500)
  }

  // ── Tag with metadata from admin's input ─────────────────────
  const previews = extracted.map((q, i) => ({
    ...q,
    subject:    subject,
    examType:   examType || 'WASSCE',
    year:       Number(year) || new Date().getFullYear(),
    isAIGenerated: false,    // these are transcribed from a real PDF, not generated
    isPDFExtracted: true,
    // Admin-selected: whether this PDF is a genuine past exam paper
    // (counts toward predictions) or practice/supplementary content
    // (excluded from predictions, still usable for practice/mock exams).
    questionSource,
    previewId:  `pdf_${Date.now()}_${i}`,
  }))

  res.json({
    success:       true,
    message:       `${previews.length} questions extracted — review before saving`,
    count:         previews.length,
    pageCount:     extractedText.length > 0 ? 'detected' : 'unknown',
    previews,
  })
})

// ── GET /api/admin/review-queue ────────────────────────────────
// Lists questions awaiting admin review — inserted by the batch PDF
// extractor with isActive: false, pendingReview: true, so they never
// reach students until approved here.
export const getReviewQueue = asyncHandler(async (req, res) => {
  const { subject, examType, page = 1, limit = 50 } = req.query

  const filter = { pendingReview: true }
  if (subject)  filter.subject  = subject
  if (examType) filter.examType = examType

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Question.countDocuments(filter)

  const questions = await Question.find(filter)
    .sort({ subject: 1, year: 1, createdAt: 1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()

  res.json({
    success: true,
    total,
    page:  Number(page),
    pages: Math.ceil(total / Number(limit)),
    // QuestionPreviewTable (shared with the generate/PDF preview flows)
    // keys each row by `previewId`
    questions: questions.map(q => ({ ...q, previewId: q._id.toString() })),
  })
})

// ── POST /api/admin/review-queue/approve ───────────────────────
// Admin approved (and possibly hand-edited) pending questions —
// flips them live by setting isActive: true, pendingReview: false.
export const approveReviewQueue = asyncHandler(async (req, res) => {
  const { questions } = req.body
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('No questions provided for approval', 400)
  }

  const results = await Promise.all(questions.map((q) => {
    const { _id, previewId, __v, createdAt, updatedAt, ...fields } = q
    return Question.findByIdAndUpdate(
      _id || previewId,
      { ...fields, isActive: true, pendingReview: false },
      { new: true, runValidators: true }
    )
  }))

  const approved = results.filter(Boolean)

  res.json({
    success: true,
    message: `${approved.length} question${approved.length !== 1 ? 's' : ''} approved and added to the live bank`,
    count:   approved.length,
  })
})

// ── DELETE /api/admin/review-queue/:id ─────────────────────────
// Admin rejected a pending question. Hard delete — it was never
// live, so there's nothing worth preserving with a soft delete.
export const rejectReviewQueueItem = asyncHandler(async (req, res) => {
  const deleted = await Question.findOneAndDelete({
    _id: req.params.id,
    pendingReview: true, // safety: never touch an already-approved question via this route
  })
  if (!deleted) throw new AppError('Pending question not found', 404)

  res.json({ success: true, message: 'Question rejected and removed' })
})

// ── Prompt builders (kept separate for clarity) ───────────────

const buildGenerationPrompt = ({
  subject, examType, topic, subtopic, year,
  difficulty, difficultyLabel, type,
  section, marks, count,
}) => {
  const mcqInstructions = type === 'MCQ' ? `
Each question must have:
- "options": exactly 4 strings (the answer choices, no A/B/C/D labels — just the text)
- "correctOption": one of "A", "B", "C", or "D"
- "modelAnswer": empty string ""` : ''

  const structuredInstructions = type === 'Structured' ? `
Each question must have:
- "options": empty array []
- "correctOption": empty string ""
- "modelAnswer": a detailed marking guide listing the expected answer points
- "parts": array of sub-questions, e.g. [{"part":"a","text":"...","marks":3,"answer":"..."}]
  The parts marks should sum to ${marks} total marks.` : ''

  const essayInstructions = type === 'Essay' ? `
Each question must have:
- "options": empty array []
- "correctOption": empty string ""  
- "modelAnswer": a detailed marking guide with key points worth marks
- "parts": empty array []` : ''

  return `Generate exactly ${count} ${examType} ${subject} examination questions.

Specifications:
- Topic: ${topic}
- Subtopic: ${subtopic || 'general'}
- Year style: ${year} (questions should feel like they are from this era)
- Question type: ${type}
- Section: ${section} (${marks} mark${marks > 1 ? 's' : ''} per question)
- Difficulty: Level ${difficulty} — ${difficultyLabel}

WAEC standards to follow:
- Use precise, unambiguous language matching WAEC examiner style
- Include authentic Ghanaian context where appropriate
- Ensure questions test understanding, not just memorisation
- Questions must be answerable from the standard ${examType} ${subject} syllabus
${mcqInstructions}
${structuredInstructions}
${essayInstructions}

Return ONLY a JSON array with exactly ${count} objects, each matching this structure:
[
  {
    "questionText": "Full question text here",
    "options": [],
    "correctOption": "",
    "modelAnswer": "",
    "parts": [],
    "syllabusReference": "approximate WAEC syllabus section"
  }
]`
}
