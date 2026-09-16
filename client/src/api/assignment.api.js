import api from './client'

export const assignmentAPI = {
  joinClass:  (joinCode) => api.post('/assignments/join', { joinCode }),
  getClasses: ()         => api.get('/assignments/classes'),

  getMyAssignments: (subject) => api.get('/assignments', { params: subject ? { subject } : {} }),
  getPendingCount:  ()        => api.get('/assignments/pending-count'),
  getSubmission:    (submissionId) => api.get(`/assignments/${submissionId}`),
  saveAnswer:       (submissionId, questionIndex, studentAnswer, wasScanned = false) =>
    api.patch(`/assignments/${submissionId}/answer`, { questionIndex, studentAnswer, wasScanned }),
  submit:           (submissionId) => api.post(`/assignments/${submissionId}/submit`),

  // Vision transcription can take a few seconds longer than a typical
  // call — same reasoning as the PDF/photo extraction timeouts elsewhere.
  extractAnswerFromPhoto: (imageBase64, mimeType, questionText) =>
    api.post('/assignments/extract-photo', { imageBase64, mimeType, questionText }, { timeout: 60000 }),
}
