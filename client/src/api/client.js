import axios from 'axios'

// ── Base API client ────────────────────────────────────────────
// All API calls go through this instance so we never have to
// repeat base URLs or auth headers in individual service files.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s — generous for AI generation endpoints
})

// ── Request interceptor: attach JWT ───────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eduprepai_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 globally ─────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eduprepai_token')
      localStorage.removeItem('eduprepai_user')
      window.location.href = '/login'
    }
    const message = error.response?.data?.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

export default api
