import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Users, LogOut } from 'lucide-react'
import examHallBg from '../../assets/exam-hall-bg.jpg'

// ── TeacherShell ───────────────────────────────────────────────
// The teacher portal's own layout — mirrors AdminShell.jsx's approach
// (masthead + full-width content, no student sidebar) but with its own
// blue identity so it reads as a distinct role, not "admin lite".
export default function TeacherShell({ children }) {
  const { user, logout } = useAuth()
  const navigate           = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/teacher/login')
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `linear-gradient(rgba(241,245,249,0.93), rgba(241,245,249,0.93)), url(${examHallBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <header
        className="sticky top-0 z-20 flex items-center gap-4 px-5 md:px-8 py-4"
        style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E293B 55%, #0f172a 100%)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-blue-400/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            EduPrepAI Teacher Portal
          </p>
          <p className="text-blue-300 text-xs">Classes & assignments</p>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-950">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'T'}
            </span>
          </div>
          <span className="text-blue-100 text-sm font-medium truncate max-w-[10rem]">
            {user?.fullName}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <main className="p-5 md:p-8 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
