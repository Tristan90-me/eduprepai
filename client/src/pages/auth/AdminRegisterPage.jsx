import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheck, User, Mail, Lock, KeyRound, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminRegisterPage() {
  const { adminRegister } = useAuth()
  const navigate           = useNavigate()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', inviteCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    setError('')
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await adminRegister(form)
      toast.success('Admin account created!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md animate-fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 mb-4">
            <ShieldCheck className="w-6 h-6 text-amber-300" />
          </div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Create an admin account
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Requires a valid invite code from an existing administrator
          </p>
        </div>

        <div className="card shadow-md">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <span className="flex-shrink-0 mt-0.5">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" name="fullName" value={form.fullName}
                  onChange={handleChange} required placeholder="e.g. Ama Boateng"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} required placeholder="admin@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password" name="password" value={form.password}
                  onChange={handleChange} required placeholder="At least 6 characters"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Invite code</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" name="inviteCode" value={form.inviteCode}
                  onChange={handleChange} required placeholder="Provided by an existing admin"
                  className="input pl-10"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading
                ? <><span className="spinner border-white/40 border-t-white" /> Creating…</>
                : <>Create admin account <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an admin account?{' '}
          <Link to="/admin/login" className="text-teal-600 font-medium hover:text-teal-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
