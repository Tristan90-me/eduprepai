import api from './client'

// ── Practice module API calls ──────────────────────────────────
export const practiceAPI = {
  // Fetch questions for a session
  getQuestions:  (params)  => api.get('/practice/questions', { params }),

  // Get topics with mastery data for subject picker
  getTopics:     (params)  => api.get('/practice/topics',    { params }),

  // Ordered mastery-progression path (Session Path) for a subject
  getSessionPath: (params) => api.get('/practice/session-path', { params }),

  // Cross-subject topic search for the command palette (⌘K)
  searchTopics:  (params)  => api.get('/practice/topics/search', { params }),

  // Get student mastery profile for a subject
  getMastery:    (params)  => api.get('/practice/mastery',   { params }),

  // Recent session history
  getSessions:   (params)  => api.get('/practice/sessions',  { params }),

  // Submit a single answer — returns marking result
  submitAnswer:  (data)    => api.post('/practice/submit',  data),

  // Request AI explanation for a question
  getExplanation: (data)   => api.post('/practice/explain', data),

  // Save completed session
  saveSession:   (data)    => api.post('/practice/session', data),
}