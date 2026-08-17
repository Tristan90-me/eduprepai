import { useState, useEffect }  from 'react'
import { useAuth }               from '../../context/AuthContext'
import { settingsAPI }           from '../../api/settings.api'
import AppShell                  from '../../components/layout/AppShell'
import BadgeCard                 from '../../components/BadgeCard'
import {
  User, Lock, BookOpen, Award,
  Save, Flame, Target, BarChart2,
  CheckCircle2, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { SUBJECTS_WASSCE, SUBJECTS_BECE, getPickerTiles } from '../../constants/subjects'

// ── Settings tabs ──────────────────────────────────────────────
const TABS = [
  { id: 'profile',  label: 'Profile',  icon: User  },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'password', label: 'Password', icon: Lock  },
  { id: 'badges',   label: 'Badges',   icon: Award },
]

export default function SettingsPage() {
  const { user, updateUser } = useAuth()

  const [tab,     setTab]     = useState('profile')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  // ── Profile form state ─────────────────────────────────────
  const [fullName,  setFullName]  = useState('')
  const [school,    setSchool]    = useState('')
  const [examType,  setExamType]  = useState('WASSCE')
  const [subjects,  setSubjects]  = useState([])

  // ── Password form state ────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError,   setPwError]   = useState('')
  const [openGroup, setOpenGroup] = useState(null) // which group tile (e.g. 'Ghanaian Language') is expanded

  // ── Load profile ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await settingsAPI.getProfile()
        const p    = data.profile
        setProfile(p)
        setFullName(p.fullName || '')
        setSchool(p.school    || '')
        setExamType(p.examType || 'WASSCE')
        setSubjects(p.subjects || [])
      } catch (err) {
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Save profile ───────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!fullName.trim()) return toast.error('Name cannot be empty')
    setSaving(true)
    try {
      const data = await settingsAPI.updateProfile({ fullName, school, examType, subjects })
      updateUser({ fullName, school, examType, subjects })
      setProfile(prev => ({ ...prev, fullName, school, examType, subjects }))
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Save subjects ──────────────────────────────────────────
  const toggleSubject = (s) => {
    setSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  // Group members (e.g. Ghanaian languages) are single-choice — picking
  // one replaces any other member of the same group already selected.
  const chooseGroupOption = (groupOptions, choice) => {
    setSubjects(prev => [...prev.filter(x => !groupOptions.includes(x)), choice])
    setOpenGroup(null)
  }

  const handleSaveSubjects = async () => {
    if (subjects.length === 0) return toast.error('Select at least one subject')
    setSaving(true)
    try {
      await settingsAPI.updateProfile({ subjects, examType })
      updateUser({ subjects, examType })
      toast.success('Subjects updated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Change password ────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwError('')
    if (!currentPw || !newPw || !confirmPw) {
      return setPwError('All fields are required')
    }
    if (newPw.length < 6) {
      return setPwError('New password must be at least 6 characters')
    }
    if (newPw !== confirmPw) {
      return setPwError('New passwords do not match')
    }

    setSaving(true)
    try {
      await settingsAPI.changePassword({
        currentPassword: currentPw,
        newPassword:     newPw,
      })
      toast.success('Password changed successfully!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setPwError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Check for new badges ───────────────────────────────────
  const handleCheckBadges = async () => {
    try {
      const data = await settingsAPI.checkBadges()
      if (data.newBadges?.length > 0) {
        toast.success(data.message)
        // Reload profile to show new badges
        const profileData = await settingsAPI.getProfile()
        setProfile(profileData.profile)
      } else {
        toast(data.message, { icon: '🏅' })
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return (
    <AppShell title="Settings" subtitle="Account & preferences">
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppShell>
  )

  const subjectList = examType === 'WASSCE' ? SUBJECTS_WASSCE : SUBJECTS_BECE

  return (
    <AppShell title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Profile summary card ──────────────────────────── */}
        <div className="card flex items-center gap-5">

          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center flex-shrink-0">
            <span
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="text-lg font-bold text-slate-900 truncate"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {profile?.fullName}
            </h2>
            <p className="text-sm text-slate-500">{profile?.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {profile?.school || 'No school set'} · {profile?.examType}
            </p>
          </div>

          {/* Quick stats */}
          <div className="hidden sm:flex gap-6 flex-shrink-0">
            {[
              { icon: Target, value: profile?.totalQuestionsAnswered || 0, label: 'Questions' },
              { icon: BarChart2, value: `${profile?.accuracy || 0}%`,     label: 'Accuracy'  },
              { icon: Flame, value: `${profile?.streak || 0}d`,           label: 'Streak'    },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <Icon className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-800">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`
                flex-1 flex items-center justify-center gap-2
                py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200
                ${tab === id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════ PROFILE TAB ════════════════════════ */}
        {tab === 'profile' && (
          <div className="card space-y-5 animate-fade-in">
            <h3 className="section-title flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              Personal information
            </h3>

            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                className="input"
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="input bg-slate-50 text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">
                Email address cannot be changed
              </p>
            </div>

            <div>
              <label className="label">
                School <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={school}
                onChange={e => setSchool(e.target.value)}
                placeholder="e.g. Achimota Senior High School"
                className="input"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary w-full py-3"
            >
              {saving
                ? <><span className="spinner border-white/40 border-t-white" /> Saving…</>
                : <><Save className="w-4 h-4" /> Save profile</>
              }
            </button>
          </div>
        )}

        {/* ══════════════ SUBJECTS TAB ═══════════════════════ */}
        {tab === 'subjects' && (
          <div className="card space-y-5 animate-fade-in">
            <h3 className="section-title flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              Examination type and subjects
            </h3>

            {/* Exam type */}
            <div>
              <label className="label">I am preparing for</label>
              <div className="flex gap-3">
                {['WASSCE', 'BECE'].map(t => (
                  <button
                    key={t}
                    onClick={() => { setExamType(t); setSubjects([]); setOpenGroup(null) }}
                    className={`
                      flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all
                      ${examType === t
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                      }
                    `}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject grid */}
            <div>
              <label className="label">
                My subjects
                <span className="text-teal-600 font-normal ml-1">
                  ({subjects.length} selected)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {getPickerTiles(subjectList).map(tile => {
                  if (tile.type === 'subject') {
                    const s = tile.label
                    const isSelected = subjects.includes(s)
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSubject(s)}
                        className={`
                          flex items-center gap-2 text-left px-3 py-2.5
                          rounded-xl text-sm font-medium border-2 transition-all
                          ${isSelected
                            ? 'bg-teal-50 text-teal-700 border-teal-400'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-200'
                          }
                        `}
                      >
                        <div className={`
                          w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          ${isSelected
                            ? 'bg-teal-500 border-teal-500'
                            : 'border-slate-300'
                          }
                        `}>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        {s}
                      </button>
                    )
                  }

                  // ── Group tile (e.g. 'Ghanaian Language') — expands
                  // into a single-choice list of its member subjects.
                  const selectedOption = tile.options.find(o => subjects.includes(o))
                  const isOpen = openGroup === tile.label
                  return (
                    <div key={tile.label} className="col-span-2">
                      <button
                        onClick={() => setOpenGroup(isOpen ? null : tile.label)}
                        className={`
                          w-full flex items-center justify-between gap-2 text-left px-3 py-2.5
                          rounded-xl text-sm font-medium border-2 transition-all
                          ${selectedOption
                            ? 'bg-teal-50 text-teal-700 border-teal-400'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-200'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`
                            w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                            ${selectedOption
                              ? 'bg-teal-500 border-teal-500'
                              : 'border-slate-300'
                            }
                          `}>
                            {selectedOption && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          {tile.label}
                        </div>
                        <span className="text-xs text-slate-400 font-normal">
                          {selectedOption || 'Choose one ›'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="mt-1.5 ml-2 pl-2.5 border-l-2 border-teal-200 space-y-1 animate-fade-in">
                          {tile.options.map(lang => (
                            <button
                              key={lang}
                              onClick={() => chooseGroupOption(tile.options, lang)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                                selectedOption === lang
                                  ? 'bg-teal-100 text-teal-800 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleSaveSubjects}
              disabled={saving || subjects.length === 0}
              className="btn-primary w-full py-3"
            >
              {saving
                ? <><span className="spinner border-white/40 border-t-white" /> Saving…</>
                : <><Save className="w-4 h-4" /> Save subjects</>
              }
            </button>
          </div>
        )}

        {/* ══════════════ PASSWORD TAB ═══════════════════════ */}
        {tab === 'password' && (
          <div className="card space-y-5 animate-fade-in">
            <h3 className="section-title flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              Change password
            </h3>

            {pwError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {pwError}
              </div>
            )}

            <div>
              <label className="label">Current password</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => { setPwError(''); setCurrentPw(e.target.value) }}
                placeholder="Your current password"
                className="input"
              />
            </div>

            <div>
              <label className="label">New password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => { setPwError(''); setNewPw(e.target.value) }}
                placeholder="At least 6 characters"
                className="input"
              />
            </div>

            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => { setPwError(''); setConfirmPw(e.target.value) }}
                placeholder="Repeat your new password"
                className="input"
              />
            </div>

            {/* Password strength hint */}
            {newPw.length > 0 && (
              <div className="space-y-1.5">
                {[
                  { label: 'At least 6 characters',    pass: newPw.length >= 6     },
                  { label: 'Contains a number',         pass: /\d/.test(newPw)      },
                  { label: 'Matches confirmation',       pass: newPw === confirmPw && confirmPw.length > 0 },
                ].map(({ label, pass }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${pass ? 'text-green-500' : 'text-slate-300'}`} />
                    <span className={pass ? 'text-green-700' : 'text-slate-400'}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={saving}
              className="btn-primary w-full py-3"
            >
              {saving
                ? <><span className="spinner border-white/40 border-t-white" /> Changing…</>
                : <><Lock className="w-4 h-4" /> Change password</>
              }
            </button>
          </div>
        )}

        {/* ══════════════ BADGES TAB ═════════════════════════ */}
        {tab === 'badges' && (
          <div className="space-y-5 animate-fade-in">

            {/* Badge overview */}
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p
                  className="font-bold text-slate-900"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {profile?.badgesEarned?.length || 0} of {profile?.totalBadges || 0} badges earned
                </p>
                <div className="w-full progress-bar mt-2">
                  <div
                    className="progress-fill bg-amber-500"
                    style={{
                      width: `${profile?.totalBadges > 0
                        ? Math.round(((profile?.badgesEarned?.length || 0) / profile.totalBadges) * 100)
                        : 0}%`
                    }}
                  />
                </div>
              </div>
              <button onClick={handleCheckBadges} className="btn-secondary text-sm flex-shrink-0">
                Check now
              </button>
            </div>

            {/* Earned badges */}
            {profile?.badgesEarned?.length > 0 && (
              <div className="card">
                <h3 className="section-title flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Earned badges
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {profile.badgesEarned.map(badge => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      size="md"
                      showDescription
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Locked badges */}
            {profile?.badgesLocked?.length > 0 && (
              <div className="card">
                <h3 className="section-title text-slate-500">
                  Locked badges — {profile.badgesLocked.length} remaining
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {profile.badgesLocked.map(badge => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      size="md"
                      showDescription
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!profile?.badgesEarned || profile.badgesEarned.length === 0) && (
              <div className="card text-center py-12">
                <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="font-medium text-slate-500">No badges yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Complete practice sessions and mock exams to earn your first badge
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </AppShell>
  )
}