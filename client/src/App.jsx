import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

import LoginPage         from './pages/auth/LoginPage'
import RegisterPage      from './pages/auth/RegisterPage'
import AdminRegisterPage from './pages/auth/AdminRegisterPage'
import DashboardPage   from './pages/student/DashboardPage'
import PracticePage    from './pages/student/PracticePage'
import PredictionPage  from './pages/student/PredictionPage'
import MockExamPage       from './pages/student/MockExamPage'
import MockExamReviewPage from './pages/student/MockExamReviewPage'
import ReportPage      from './pages/student/ReportPage'
import AnalyticsPage   from './pages/student/AnalyticsPage'
import LeaderboardPage from './pages/student/LeaderboardPage'
import SettingsPage    from './pages/student/SettingsPage'
import AssignmentsPage       from './pages/student/AssignmentsPage'
import AssignmentAnswerPage  from './pages/student/AssignmentAnswerPage'
import AdminPage       from './pages/admin/AdminPage'
import TeacherPage     from './pages/teacher/TeacherPage'

// Where each role lands on "/" and after login — the single source of
// truth other role-based redirects below key off of.
const roleHome = { student: '/dashboard', admin: '/admin', teacher: '/teacher' }
const homeFor = (role) => roleHome[role] || '/dashboard'

// ── Route guards ───────────────────────────────────────────────
// PrivateRoute: only logged-in users can access.
// `allowedRoles` restricts a route to specific roles (e.g. ['admin'],
// ['teacher'], or ['student']) — anyone else is bounced to their own
// home instead. Admins manage content and teachers manage classes;
// neither practices questions, sits mock exams, or appears on the
// leaderboard, so student-facing pages stay closed to both.
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  // A single unified /login (role dropdown) now covers every role.
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />
  }
  return children
}

// PublicRoute: only non-logged-in users can access.
// Logged-in users are sent to their own landing page — no role ever
// lands on another role's page, even transiently.
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (user)    return <Navigate to={homeFor(user.role)} replace />
  return children
}

// RootRedirect: used for "/" and any unmatched path — sends logged-out
// visitors to login and routes each role to its own home, so no role
// can bounce through another role's page even as a redirect waypoint.
const RootRedirect = () => {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!user)   return <Navigate to="/login" replace />
  return <Navigate to={homeFor(user.role)} replace />
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
    {/* Root — role-aware landing, never a student page for an admin */}
    <Route path="/"            element={<RootRedirect />} />

    {/* Public — redirect to the right landing page if already logged in */}
    <Route path="/login"       element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register"    element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* Admin — separate entry point, never linked from student pages.
       Admin registration stays its own dedicated invite-gated page,
       deliberately not folded into the unified /register toggle. */}
    <Route path="/admin/register" element={<PublicRoute><AdminRegisterPage /></PublicRoute>} />

    {/* /login now covers all three roles via a dropdown, and /register
       covers student+teacher via a toggle — these old separate entry
       points are kept only as redirects so existing links don't 404. */}
    <Route path="/admin/login"      element={<Navigate to="/login" replace />} />
    <Route path="/teacher/login"    element={<Navigate to="/login" replace />} />
    <Route path="/teacher/register" element={<Navigate to="/register" replace />} />

    {/* Student — require login, closed off to admins and teachers */}
    <Route path="/dashboard"   element={<PrivateRoute allowedRoles={['student']}><DashboardPage /></PrivateRoute>} />
    <Route path="/practice"    element={<PrivateRoute allowedRoles={['student']}><PracticePage /></PrivateRoute>} />
    <Route path="/predict"     element={<PrivateRoute allowedRoles={['student']}><PredictionPage /></PrivateRoute>} />
    <Route path="/mock-exam"   element={<PrivateRoute allowedRoles={['student']}><MockExamPage /></PrivateRoute>} />
    <Route path="/mock-exam/:id/review" element={<PrivateRoute allowedRoles={['student']}><MockExamReviewPage /></PrivateRoute>} />
    <Route path="/report/:id"  element={<PrivateRoute allowedRoles={['student']}><ReportPage /></PrivateRoute>} />
    <Route path="/analytics"   element={<PrivateRoute allowedRoles={['student']}><AnalyticsPage /></PrivateRoute>} />
    <Route path="/leaderboard" element={<PrivateRoute allowedRoles={['student']}><LeaderboardPage /></PrivateRoute>} />
    <Route path="/settings"    element={<PrivateRoute allowedRoles={['student']}><SettingsPage /></PrivateRoute>} />
    <Route path="/assignments"     element={<PrivateRoute allowedRoles={['student']}><AssignmentsPage /></PrivateRoute>} />
    <Route path="/assignments/:submissionId" element={<PrivateRoute allowedRoles={['student']}><AssignmentAnswerPage /></PrivateRoute>} />

    {/* Admin — require login AND admin role. Prediction management
       (re-run analysis, accuracy logging) lives inside this panel now
       rather than on the shared student prediction page. */}
    <Route path="/admin"       element={<PrivateRoute allowedRoles={['admin']}><AdminPage /></PrivateRoute>} />

    {/* Teacher — classes + assignment creation */}
    <Route path="/teacher"     element={<PrivateRoute allowedRoles={['teacher']}><TeacherPage /></PrivateRoute>} />

    {/* Catch-all — role-aware, same as "/" */}
    <Route path="*"            element={<RootRedirect />} />
  </Routes>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
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