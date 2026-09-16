import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { assignmentAPI } from '../../api/assignment.api'
import {
  LayoutDashboard, BookOpen, TrendingUp, FileText,
  BarChart2, Trophy, Settings, LogOut, ClipboardList,
  ChevronRight, GraduationCap,
} from 'lucide-react'

// This sidebar only ever renders for students — admins/teachers have
// their own shells with no student nav items, so there's nothing
// role-based to branch on here any more.
const STUDENT_NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/practice',    icon: BookOpen,         label: 'Practice'    },
  { to: '/predict',     icon: TrendingUp,       label: 'Predictions' },
  { to: '/mock-exam',   icon: FileText,         label: 'Mock Exam'   },
  { to: '/assignments', icon: ClipboardList,    label: 'Assignments' },
  { to: '/analytics',   icon: BarChart2,        label: 'Analytics'   },
  { to: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate          = useNavigate()

  // Fetch once on mount — this app's existing notification-adjacent
  // features (e.g. badge toasts) are all fetch-on-load, not real-time,
  // so a pending-assignment count follows the same convention rather
  // than adding new polling infrastructure just for this.
  const [pendingAssignments, setPendingAssignments] = useState(0)
  useEffect(() => {
    assignmentAPI.getPendingCount()
      .then(data => setPendingAssignments(data.count || 0))
      .catch(() => {}) // silent — badge just stays at 0
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const accuracy = user?.totalQuestionsAnswered > 0
    ? Math.round((user.totalCorrect / user.totalQuestionsAnswered) * 100)
    : 0

  return (
    <>
      {/* Dimmed overlay on mobile when sidebar is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          sidebar-scroll overflow-y-auto
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 'var(--sidebar-width)',
          background: 'linear-gradient(180deg, #134E4A 0%, #0D3B37 100%)',
        }}
        aria-label="Main navigation"
      >
        {/* ── Logo ────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-teal-400/20 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <p
              className="font-semibold text-white text-sm"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              EduPrepAI
            </p>
            <p className="text-teal-300 text-xs">WASSCE · BECE</p>
          </div>
        </div>

        {/* ── User card ────────────────────────────────────── */}
        <div className="mx-4 mt-4 rounded-xl bg-white/8 border border-white/10 p-3.5">
          <div className="flex items-center gap-3">
            {/* Avatar initial */}
            <div className="w-9 h-9 rounded-full bg-teal-400 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-teal-900">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-teal-300 text-xs truncate">{user?.examType || 'Student'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{user?.streak || 0}</p>
              <p className="text-teal-400 text-xs">Day streak</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{accuracy}%</p>
              <p className="text-teal-400 text-xs">Accuracy</p>
            </div>
          </div>
        </div>

        {/* ── Navigation links ─────────────────────────────── */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Sidebar navigation">
          <p className="text-teal-500 text-xs font-medium uppercase tracking-wider px-3 mb-2">
            Study Tools
          </p>

          {STUDENT_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-150 group relative
                ${isActive
                  ? 'bg-teal-400/20 text-white font-medium'
                  : 'text-teal-100/80 hover:bg-white/8 hover:text-white'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar on left edge */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal-400 rounded-r-full" />
                  )}
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-teal-400' : 'text-teal-400/60 group-hover:text-teal-300'}`} />
                  <span className="flex-1">{label}</span>
                  {to === '/assignments' && pendingAssignments > 0 && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {pendingAssignments}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 text-teal-400/60" />}
                </>
              )}
            </NavLink>
          ))}

          {/* Subject quick-links */}
          {user?.subjects?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-teal-500 text-xs font-medium uppercase tracking-wider px-3 mb-2">
                My Subjects
              </p>
              {user.subjects.slice(0, 4).map(subject => (
                <div
                  key={subject}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-teal-200/70 hover:text-teal-100 cursor-pointer transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400/50 flex-shrink-0" />
                  <span className="truncate">{subject}</span>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* ── Bottom: settings + logout ─────────────────────── */}
        <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-3">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-teal-100/70 hover:bg-white/8 hover:text-white transition-all duration-150"
          >
            <Settings className="w-4 h-4 text-teal-400/60" />
            Settings
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-teal-100/70 hover:bg-red-500/15 hover:text-red-300 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}