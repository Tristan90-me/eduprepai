import api from './client'

export const mockExamAPI = {
  // Generate a new paper
  generate:   (data)              => api.post('/mock-exams/generate', data),

  // Get a specific exam
  getExam:    (id)                => api.get(`/mock-exams/${id}`),

  // Get student's exam history
  getMyExams: (params)            => api.get('/mock-exams', { params }),

  // Start the exam timer
  start:      (id)                => api.post(`/mock-exams/${id}/start`),

  // Auto-save a single answer (called periodically)
  saveAnswer: (id, data)          => api.patch(`/mock-exams/${id}/answer`, data),

  // Submit entire paper for marking
  submit:     (id, data)          => api.post(`/mock-exams/${id}/submit`, data),

  // Admin
  allResults: (params)            => api.get('/mock-exams/admin/all-results', { params }),
}