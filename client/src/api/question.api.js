import api from './client'

export const questionAPI = {
  // Get filtered questions
  getQuestions:  (params) => api.get('/questions', { params }),

  // Get single question
  getById:       (id)     => api.get(`/questions/${id}`),

  // Lazily fetch a question's diagram image — only called when a
  // question flagged hasImage:true is actually being displayed
  getImage:      (id)     => api.get(`/questions/${id}/image`),

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
