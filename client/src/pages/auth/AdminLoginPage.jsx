import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheck, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const { adminLogin } = useAuth()
  const navigate        = useNavigate()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)

  const handleChange = (e) => { setError(''); setForm({ ...form, [e.target.name]: e.target.value }) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await adminLogin(form)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>

      {/* ── Left branding panel — desktop only ───────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10"
        style={{ background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 60%, #0a0f1a 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-amber-300" />
          </div>
          <span
            className="text-white font-semibold text-lg"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            EduPrepAI Admin
          </span>
        </div>

        {/* Hero copy */}
        <div className="space-y-5">
          <div>
            <h1
              className="text-3xl font-bold text-white leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Question bank & content control.
            </h1>
            <p className="text-slate-300/80 mt-3 text-sm leading-relaxed">
              Manage the question bank, generate AI content, review predictions,
              and enter physical exam results — restricted to authorised staff.
            </p>
          </div>
        </div>

        {/* Bottom badge */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/6 border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <p className="text-white text-xs font-medium">Administrator access only</p>
            <p className="text-slate-400 text-xs">Not a student? Use the regular sign in</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-5 lg:p-10">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <ShieldCheck className="w-6 h-6 text-slate-700" />
            <span
              className="font-semibold text-slate-800"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              EduPrepAI Admin
            </span>
          </div>

          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Administrator sign in
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Restricted access — for authorised staff only.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm animate-fade-in">
              <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} required
                  placeholder="admin@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} required
                  placeholder="Your password"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading
                ? <><span className="spinner border-white/40 border-t-white" /> Signing in…</>
                : <>Sign in <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Have an invite code?{' '}
            <Link to="/admin/register" className="text-teal-600 font-medium hover:text-teal-700 transition-colors">
              Create an admin account
            </Link>
          </p>
          <p className="text-center text-xs text-slate-400 mt-2">
            <Link to="/login" className="hover:text-slate-600 transition-colors">
              Not an admin? Student sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
