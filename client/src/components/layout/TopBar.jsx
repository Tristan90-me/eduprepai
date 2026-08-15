import { Menu, Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// ── TopBar ─────────────────────────────────────────────────────
// Fixed header that sits above every authenticated page.
// Offset from the left by the sidebar width on desktop.
export default function TopBar({ onMenuClick, title, subtitle }) {
  const { user } = useAuth()

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

      {/* Search bar — desktop only, decorative for now */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-48 cursor-pointer hover:border-teal-400 transition-colors">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400">Search...</span>
        <kbd className="ml-auto text-xs text-slate-300 bg-white border border-slate-200 rounded px-1">⌘K</kbd>
      </div>

      {/* Notification bell */}
      <button
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
      </button>

      {/* User avatar */}
      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-teal-400 hover:ring-offset-1 transition-all">
        <span className="text-xs font-semibold text-white">
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </span>
      </div>
    </header>
  )
}