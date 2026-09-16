import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheck, LogOut } from 'lucide-react'
import examHallBg from '../../assets/exam-hall-bg.jpg'

// ── AdminShell ───────────────────────────────────────────────────
// The admin panel's own layout — deliberately separate from AppShell.
// No student sidebar, no ⌘K practice-jump command palette, no student
// nav links: admins manage content here, they don't get a student
// experience bundled in. AdminPage owns its own tab navigation, so
// this shell is just a masthead + full-width content area, not a
// second sidebar duplicating that navigation.
//
// `.admin-theme` rescopes the shared teal-branded utility classes
// (btn-primary, badge-teal, input focus rings, etc.) to an indigo/slate
// palette for every admin panel and its tabs — see index.css.
export default function AdminShell({ children }) {
  const { user, logout } = useAuth()
  const navigate           = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div
      className="admin-theme min-h-screen"
      style={{
        // More visible than the student AppShell's default wash, per
        // request — the admin console's cards are all solid white, so a
        // clearer background image doesn't hurt readability here.
        backgroundImage: `linear-gradient(rgba(241,245,249,0.75), rgba(241,245,249,0.75)), url(${examHallBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <header
        className="sticky top-0 z-20 flex items-center gap-4 px-5 md:px-8 py-4"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 55%, #1E293B 100%)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-400/20 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-indigo-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            EduPrepAI Admin Console
          </p>
          <p className="text-indigo-300 text-xs">Content & question bank control</p>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center">
            <span className="text-xs font-semibold text-indigo-950">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <span className="text-indigo-100 text-sm font-medium truncate max-w-[10rem]">
            {user?.fullName}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-indigo-200 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
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
