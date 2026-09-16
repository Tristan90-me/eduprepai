import axios from 'axios'

// ── Base API client ────────────────────────────────────────────
// All API calls go through this instance so we never have to
// repeat base URLs or auth headers in individual service files.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s — generous for AI generation endpoints
})

// sessionStorage, not localStorage — each browser tab keeps its own
// independent session (see AuthContext.jsx for why), so this must read
// the same storage AuthContext writes to.

// ── Request interceptor: attach JWT ───────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('eduprepai_token')
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
      // /login now covers every role via a dropdown, so there's no
      // longer a separate admin/teacher login path to route back to.
      sessionStorage.removeItem('eduprepai_token')
      sessionStorage.removeItem('eduprepai_user')
      window.location.href = '/login'
    }
    const message = error.response?.data?.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

export default api
