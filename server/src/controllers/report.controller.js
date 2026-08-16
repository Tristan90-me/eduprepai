import MockExam from '../models/MockExam.model.js'
import User     from '../models/User.model.js'
import { generateMockExamPDF } from '../utils/pdfReport.utils.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'

// ── GET /api/reports/mock/:examId ──────────────────────────────
// Returns a JSON summary of the exam for the ReportPage UI.
// The client uses this to render the in-app results view.
export const getReportPreview = asyncHandler(async (req, res) => {
  const exam = await MockExam.findOne({
    _id:       req.params.examId,
    studentId: req.user._id,
    status:    'marked',
  })

  if (!exam) throw new AppError('Marked exam not found', 404)

  const student = await User.findById(req.user._id)
    .select('fullName school examType')
    .lean()

  res.json({
    success: true,
    report: {
      examId:           exam._id,
      student,
      subject:          exam.subject,
      examType:         exam.examType,
      year:             exam.year,
      submittedAt:      exam.submittedAt,
      timeSpentSeconds: exam.timeSpentSeconds,
      results:          exam.results,
      sectionB: exam.sectionB.map(q => ({
        questionText: q.questionText,
        topic:        q.topic,
        marks:        q.marks,
        marksAwarded: q.marksAwarded,
        aiFeedback:   q.aiFeedback,
        partResults:  q.partResults,
      })),
      sectionC: exam.sectionC
        .filter(q => q.studentAnswer?.trim())
        .map(q => ({
          questionText: q.questionText,
          topic:        q.topic,
          marks:        q.marks,
          marksAwarded: q.marksAwarded,
          aiFeedback:   q.aiFeedback,
          partResults:  q.partResults,
        })),
    },
  })
})

// ── GET /api/reports/mock/:examId/download ─────────────────────
// Generates and streams a PDF report for a completed mock exam.
// PDF is generated on demand — not stored — saves storage costs.
export const downloadMockReport = asyncHandler(async (req, res) => {
  const exam = await MockExam.findOne({
    _id:       req.params.examId,
    studentId: req.user._id,
    status:    'marked',
  })

  if (!exam) {
    throw new AppError(
      'Marked exam not found. Complete and submit the exam first.',
      404
    )
  }

  const student = await User.findById(req.user._id)
    .select('fullName school examType')
    .lean()

  // Generate the PDF buffer
  const pdfBuffer = await generateMockExamPDF(exam, student)

  // Build a clean filename
  const filename = `EduPrepAI_${exam.subject.replace(/\s+/g, '_')}_${exam.examType}_Report.pdf`

  // Stream the PDF to the client
  res.setHeader('Content-Type',        'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Length',      pdfBuffer.length)
  res.send(pdfBuffer)
})