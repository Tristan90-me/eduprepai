import api from './client'

export const adminAPI = {
  // ── AI question tools ──────────────────────────────────────
  generateQuestions: (config)    => api.post('/admin/generate-questions', config),
  approveQuestions:  (questions) => api.post('/admin/approve-questions', { questions }),
  // Rendering every page to an image for the AI to see (so it can read
  // diagrams) plus a multimodal AI call takes noticeably longer than the
  // old text-only extraction, especially for longer papers — override the
  // shared 30s default rather than raising it for every other endpoint.
  extractFromPDF:    (data)      => api.post('/admin/extract-pdf', data, { timeout: 120000 }),

  // ── Review queue (batch PDF extraction) ────────────────────
  getReviewQueue:        (params)     => api.get('/admin/review-queue', { params }),
  approveReviewQueue:    (questions)  => api.post('/admin/review-queue/approve', { questions }),
  rejectReviewQueueItem: (id)         => api.delete(`/admin/review-queue/${id}`),

  // ── Physical exam grading (Option 5) ──────────────────────
  getStudents:        ()               => api.get('/admin/physical/students'),
  getStudentExams:    (studentId)      => api.get(`/admin/physical/exams/${studentId}`),
  submitPhysicalExam: (data)           => api.post('/admin/physical/submit', data),
  extractFromPhoto:   (data)           => api.post('/admin/physical/extract-photo', data),
}