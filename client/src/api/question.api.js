import api from './client'

export const questionAPI = {
  // Get filtered questions
  getQuestions:  (params) => api.get('/questions', { params }),

  // Get single question
  getById:       (id)     => api.get(`/questions/${id}`),

  // Get all topics for a subject (used by practice & prediction)
  getTopics:     (params) => api.get('/questions/topics', { params }),

  // Admin — question bank overview
  getStats:      ()       => api.get('/questions/stats'),

  // Admin — add questions
  create:        (data)   => api.post('/questions', data),
  bulkCreate:    (data)   => api.post('/questions/bulk', data),
  update:        (id, data) => api.put(`/questions/${id}`, data),
  remove:        (id)     => api.delete(`/questions/${id}`),
}
