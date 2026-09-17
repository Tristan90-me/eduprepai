import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

// sessionStorage, not localStorage — deliberately. localStorage is
// shared across every tab of the same origin, so logging into a
// different role/account in one tab silently overwrote every other
// open tab's session (surfacing later as a confusing "you do not have
// permission" error). sessionStorage is isolated per tab: two tabs
// opened independently (not via "duplicate tab") get their own
// completely separate copy, so two different accounts/roles can be
// logged in at once with zero interference. The trade-off, confirmed
// with the user: a session no longer survives closing its tab or
// restarting the browser — logging in again is required each time a
// fresh tab opens, even as the same user.
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true) // true while checking stored session

  // ── Restore session on page load ───────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem('eduprepai_user')
    const token  = sessionStorage.getItem('eduprepai_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  // ── Register ───────────────────────────────────────────────
  const register = async (formData) => {
    const data = await api.post('/auth/register', formData)
    sessionStorage.setItem('eduprepai_token', data.token)
    sessionStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Login ──────────────────────────────────────────────────
  const login = async (credentials) => {
    const data = await api.post('/auth/login', credentials)
    sessionStorage.setItem('eduprepai_token', data.token)
    sessionStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Admin login ────────────────────────────────────────────
  const adminLogin = async (credentials) => {
    const data = await api.post('/auth/admin-login', credentials)
    sessionStorage.setItem('eduprepai_token', data.token)
    sessionStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Admin registration (invite-code gated) ──────────────────
  const adminRegister = async (formData) => {
    const data = await api.post('/auth/admin-register', formData)
    sessionStorage.setItem('eduprepai_token', data.token)
    sessionStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Teacher login ──────────────────────────────────────────
  const teacherLogin = async (credentials) => {
    const data = await api.post('/auth/teacher-login', credentials)
    sessionStorage.setItem('eduprepai_token', data.token)
    sessionStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Teacher registration (invite-code gated) ────────────────
  const teacherRegister = async (formData) => {
    const data = await api.post('/auth/teacher-register', formData)
    sessionStorage.setItem('eduprepai_token', data.token)
    sessionStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Logout ─────────────────────────────────────────────────
  const logout = () => {
    sessionStorage.removeItem('eduprepai_token')
    sessionStorage.removeItem('eduprepai_user')
    setUser(null)
  }

  // ── Update stored user (e.g. after profile edit) ───────────
  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    sessionStorage.setItem('eduprepai_user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, adminLogin, adminRegister, teacherLogin, teacherRegister, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Custom hook ─────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
