import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, User, Mail, Lock, School, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { SUBJECTS_WASSCE, SUBJECTS_BECE } from '../../constants/subjects'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate      = useNavigate()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    school: '', examType: 'WASSCE', subjects: [],
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [step,    setStep]    = useState(1) // 1 = personal details, 2 = exam + subjects

  const subjects = form.examType === 'WASSCE' ? SUBJECTS_WASSCE : SUBJECTS_BECE

  const handleChange = (e) => {
    setError('')
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const toggleSubject = (s) => {
    setForm(p => ({
      ...p,
      subjects: p.subjects.includes(s)
        ? p.subjects.filter(x => x !== s)
        : [...p.subjects, s],
    }))
  }

  const goToStep2 = () => {
    if (!form.fullName || !form.email || !form.password) {
      return setError('Please fill in all required fields')
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.subjects.length === 0) return setError('Select at least one subject')
    setLoading(true); setError('')
    try {
      await register(form)
      toast.success('Welcome to EduPrepAI!')
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
      <div className="w-full max-w-lg animate-fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Create your free account
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Join thousands of students preparing smarter
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-7">
          {[1, 2].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all ${
                s < step   ? 'bg-teal-500 text-white'
                : s === step ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                : 'bg-slate-100 text-slate-400'
              }`}>
                {s < step ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span className={`text-xs font-medium ${s === step ? 'text-teal-700' : 'text-slate-400'}`}>
                {s === 1 ? 'Your details' : 'Your subjects'}
              </span>
              {i < 1 && (
                <div className={`flex-1 h-px ${step > 1 ? 'bg-teal-400' : 'bg-slate-200'} transition-colors`} />
              )}
            </div>
          ))}
        </div>

        <div className="card shadow-md">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <span className="flex-shrink-0 mt-0.5">⚠</span> {error}
            </div>
          )}

          {/* ── Step 1: Personal details ─────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="label">Full name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text" name="fullName" value={form.fullName}
                    onChange={handleChange} required placeholder="e.g. Kwame Mensah"
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
                    onChange={handleChange} required placeholder="you@example.com"
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
                <label className="label">
                  School <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text" name="school" value={form.school}
                    onChange={handleChange} placeholder="e.g. Achimota Senior High School"
                    className="input pl-10"
                  />
                </div>
              </div>

              <button type="button" onClick={goToStep2} className="btn-primary w-full py-3">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Exam type + subjects ─────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">

              {/* Exam type toggle */}
              <div>
                <label className="label">I am preparing for</label>
                <div className="flex gap-3">
                  {['WASSCE', 'BECE'].map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm(p => ({ ...p, examType: t, subjects: [] }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.examType === t
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject picker */}
              <div>
                <label className="label">
                  Select your subjects
                  <span className="text-teal-600 font-normal ml-1">
                    ({form.subjects.length} selected)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {subjects.map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => toggleSubject(s)}
                      className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition-all ${
                        form.subjects.includes(s)
                          ? 'bg-teal-50 text-teal-700 border-teal-400'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-teal-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          form.subjects.includes(s)
                            ? 'bg-teal-500 border-teal-500'
                            : 'border-slate-300'
                        }`}>
                          {form.subjects.includes(s) && <Check className="w-2 h-2 text-white" />}
                        </div>
                        {s}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Back + submit */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-3"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || form.subjects.length === 0}
                  className="btn-primary flex-1 py-3"
                >
                  {loading
                    ? <><span className="spinner border-white/40 border-t-white" /> Creating…</>
                    : 'Create account'
                  }
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 font-medium hover:text-teal-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}