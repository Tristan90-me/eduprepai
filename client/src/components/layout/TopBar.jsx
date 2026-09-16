import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Bell, Search, CheckCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

// ── timeAgo ────────────────────────────────────────────────────
// Small relative-time formatter for the notification list — no
// need to pull in a date library for "3m ago" / "2h ago".
const timeAgo = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ── TopBar ─────────────────────────────────────────────────────
// Fixed header that sits above every authenticated page.
// Offset from the left by the sidebar width on desktop.
export default function TopBar({ onMenuClick, onOpenSearch, title, subtitle }) {
  const { user } = useAuth()
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef(null)

  // ── Close the notification panel on outside click / Escape ───
  useEffect(() => {
    if (!panelOpen) return

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setPanelOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [panelOpen])

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center gap-4 px-5 bg-white/90 backdrop-blur-md border-b border-slate-100"
      style={{
        height: 'var(--topbar-height)',
        left: 'var(--sidebar-width)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden btn-ghost p-2 -ml-2"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title passed from AppShell */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1
            className="text-base font-semibold text-slate-900 truncate"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        )}
      </div>

      {/* Search bar — desktop only. Opens the ⌘K command palette
          to jump straight into a practice session for a subject/topic. */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-48 cursor-pointer hover:border-teal-400 transition-colors"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400">Search...</span>
        <kbd className="ml-auto text-xs text-slate-300 bg-white border border-slate-200 rounded px-1">⌘K</kbd>
      </button>

      {/* Notification bell */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setPanelOpen(o => !o)}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Notifications"
          aria-expanded={panelOpen}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
          )}
        </button>

        {panelOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8 px-4">
                  You're all caught up — no notifications yet.
                </p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 ${
                      n.read ? '' : 'bg-teal-50/40'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0" role="img" aria-hidden="true">{n.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 truncate">{n.message}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User avatar — links to the profile tab on Settings */}
      <Link
        to="/settings"
        aria-label="View profile"
        className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-teal-400 hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1 transition-all"
      >
        <span className="text-xs font-semibold text-white">
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </span>
      </Link>
    </header>
  )
}
