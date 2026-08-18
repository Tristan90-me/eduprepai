import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true) // true while checking stored session

  // ── Restore session on page load ───────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('eduprepai_user')
    const token  = localStorage.getItem('eduprepai_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  // ── Register ───────────────────────────────────────────────
  const register = async (formData) => {
    const data = await api.post('/auth/register', formData)
    localStorage.setItem('eduprepai_token', data.token)
    localStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Login ──────────────────────────────────────────────────
  const login = async (credentials) => {
    const data = await api.post('/auth/login', credentials)
    localStorage.setItem('eduprepai_token', data.token)
    localStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Admin login ────────────────────────────────────────────
  const adminLogin = async (credentials) => {
    const data = await api.post('/auth/admin-login', credentials)
    localStorage.setItem('eduprepai_token', data.token)
    localStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Admin registration (invite-code gated) ──────────────────
  const adminRegister = async (formData) => {
    const data = await api.post('/auth/admin-register', formData)
    localStorage.setItem('eduprepai_token', data.token)
    localStorage.setItem('eduprepai_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  // ── Logout ─────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('eduprepai_token')
    localStorage.removeItem('eduprepai_user')
    setUser(null)
  }

  // ── Update stored user (e.g. after profile edit) ───────────
  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    localStorage.setItem('eduprepai_user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, adminLogin, adminRegister, logout, updateUser }}>
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
