import api from './client'

export const teacherAPI = {
  // ── Classes ──────────────────────────────────────────────────
  createClass: (data) => api.post('/teacher/classes', data),
  getClasses:  ()     => api.get('/teacher/classes'),

  // ── Question tools — same endpoints/behaviour as the admin panel,
  // just mounted under /teacher and scoped to the teacher's own use ──
  generateQuestions: (config) => api.post('/teacher/generate-questions', config),
  extractFromPDF:    (data)   => api.post('/teacher/extract-pdf', data, { timeout: 120000 }),

  // ── Assignments ──────────────────────────────────────────────
  createAssignment: (data)    => api.post('/teacher/assignments', data),
  getAssignments:   (classId) => api.get('/teacher/assignments', { params: classId ? { classId } : {} }),

  // ── Submission review (Phase 2 — scanned answers) ─────────────
  getPendingReviews:      ()   => api.get('/teacher/submissions'),
  getSubmissionForReview: (id) => api.get(`/teacher/submissions/${id}`),
  publishSubmission:      (id, answers) => api.post(`/teacher/submissions/${id}/publish`, { answers }),
}
