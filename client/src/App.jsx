import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import LoginPage       from './pages/auth/LoginPage'
import RegisterPage    from './pages/auth/RegisterPage'
import DashboardPage   from './pages/student/DashboardPage'
import PracticePage    from './pages/student/PracticePage'
import PredictionPage  from './pages/student/PredictionPage'
import MockExamPage    from './pages/student/MockExamPage'
import ReportPage      from './pages/student/ReportPage'
import AnalyticsPage   from './pages/student/AnalyticsPage'
import LeaderboardPage from './pages/student/LeaderboardPage'
import SettingsPage    from './pages/student/SettingsPage'
import AdminPage       from './pages/admin/AdminPage'

// ── Route guards ───────────────────────────────────────────────
// PrivateRoute: only logged-in users can access.
// adminOnly flag additionally checks the user's role.
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!user)   return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

// PublicRoute: only non-logged-in users can access.
// Logged-in users are redirected to their dashboard.
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (user)    return <Navigate to="/dashboard" replace />
  return children
}

const FullScreenSpinner = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ background: 'var(--color-bg)' }}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Loading EduPrepAI…</p>
    </div>
  </div>
)

const AppRoutes = () => (
  <Routes>
    {/* Redirect root to login */}
    <Route path="/"            element={<Navigate to="/login" replace />} />

    {/* Public — redirect to dashboard if already logged in */}
    <Route path="/login"       element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register"    element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* Student — require login */}
    <Route path="/dashboard"   element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
    <Route path="/practice"    element={<PrivateRoute><PracticePage /></PrivateRoute>} />
    <Route path="/predict"     element={<PrivateRoute><PredictionPage /></PrivateRoute>} />
    <Route path="/mock-exam"   element={<PrivateRoute><MockExamPage /></PrivateRoute>} />
    <Route path="/report/:id"  element={<PrivateRoute><ReportPage /></PrivateRoute>} />
    <Route path="/analytics"   element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
    <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
    <Route path="/settings"    element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

    {/* Admin — require login AND admin role */}
    <Route path="/admin"       element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />

    {/* Catch-all → dashboard */}
    <Route path="*"            element={<Navigate to="/dashboard" replace />} />
  </Routes>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            },
            success: { iconTheme: { primary: '#0D9488', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}