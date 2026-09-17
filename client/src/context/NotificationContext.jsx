import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

const MAX_NOTIFICATIONS = 20
const storageKey = (userId) => `eduprepai_notifications_${userId}`

// ── NotificationProvider ─────────────────────────────────────────
// Lightweight, client-only notification feed — no backend model.
// Fed entirely by events that already happen (new badges earned at
// the end of a practice session, mock exam, or manual badge check),
// via getBadgeDetails() results the server already returns. Persisted
// per-user in localStorage so it survives a refresh but stays scoped
// to whoever is signed in.
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])

  // ── Load this user's notifications on login/refresh ──────────
  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      return
    }
    try {
      const stored = localStorage.getItem(storageKey(user.id))
      setNotifications(stored ? JSON.parse(stored) : [])
    } catch {
      setNotifications([])
    }
  }, [user?.id])

  // ── Persist on every change ───────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    try {
      localStorage.setItem(storageKey(user.id), JSON.stringify(notifications))
    } catch {
      // localStorage unavailable (private browsing, quota) — notifications
      // still work for the current tab, they just won't survive a refresh.
    }
  }, [notifications, user?.id])

  // ── Add one notification per newly-earned badge ───────────────
  const addBadgeNotifications = useCallback((badges = []) => {
    if (badges.length === 0) return
    const newOnes = badges.map(badge => ({
      id:        `badge_${badge.id}_${Date.now()}`,
      icon:      badge.icon || '🏅',
      title:     'New badge earned!',
      message:   badge.name,
      createdAt: new Date().toISOString(),
      read:      false,
    }))
    setNotifications(prev => [...newOnes, ...prev].slice(0, MAX_NOTIFICATIONS))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addBadgeNotifications, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// ── Custom hook ───────────────────────────────────────────────
export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider')
  return ctx
}
