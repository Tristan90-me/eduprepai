import api from './client'

export const adminAPI = {
  // ── AI question tools ──────────────────────────────────────
  generateQuestions: (config)    => api.post('/admin/generate-questions', config),
  approveQuestions:  (questions) => api.post('/admin/approve-questions', { questions }),
  extractFromPDF:    (data)      => api.post('/admin/extract-pdf', data),

  // ── Physical exam grading (Option 5) ──────────────────────
  getStudents:        ()               => api.get('/admin/physical/students'),
  getStudentExams:    (studentId)      => api.get(`/admin/physical/exams/${studentId}`),
  submitPhysicalExam: (data)           => api.post('/admin/physical/submit', data),
  extractFromPhoto:   (data)           => api.post('/admin/physical/extract-photo', data),
}