import api from './client'

export const predictionAPI = {
  // Get predictions for a subject — uses cache automatically
  getForSubject: (subject, examType = 'WASSCE', forceRefresh = false) =>
    api.get(`/predictions/${encodeURIComponent(subject)}`, {
      params: { examType, forceRefresh },
    }),

  // Admin — log real exam results
  logAccuracy: (data) => api.post('/predictions/accuracy', data),

  // Admin — view accuracy history
  getHistory: (subject, examType = 'WASSCE') =>
    api.get(`/predictions/history/${encodeURIComponent(subject)}`, {
      params: { examType },
    }),
}