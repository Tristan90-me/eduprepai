import api from './client'

export const analyticsAPI = {
  getOverview:    ()       => api.get('/analytics/overview'),
  getLeaderboard: (params) => api.get('/analytics/leaderboard', { params }),
}