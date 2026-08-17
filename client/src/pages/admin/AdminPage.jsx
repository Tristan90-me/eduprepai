import { useState } from 'react'
import AppShell          from '../../components/layout/AppShell'
import AIGeneratorPanel  from '../../components/admin/AIGeneratorPanel'
import PDFExtractorPanel from '../../components/admin/PDFExtractorPanel'
import { questionAPI }   from '../../api/question.api'
import PhysicalExamPanel from '../../components/admin/PhysicalExamPanel'
import { BarChart2, Plus, Cpu, FileSearch, Shield, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubjectsForExamType } from '../../constants/subjects'

const BLANK = {
  subject: 'Mathematics', examType: 'WASSCE', year: 2023,
  topic: '', subtopic: '', syllabusReference: '',
  type: 'MCQ', difficulty: 3, marks: 1, section: 'A',
  questionText: '', options: ['', '', '', ''],
  correctOption: 'A', modelAnswer: '', parts: [],
}

const TABS = [
  { id: 'stats',    label: 'Bank Stats',    icon: BarChart2  },
  { id: 'manual',   label: 'Add Manually',  icon: Plus       },
  { id: 'generate', label: 'AI Generator',  icon: Cpu        },
  { id: 'pdf',      label: 'PDF Extractor', icon: FileSearch },
  { id: 'physical', label: 'Physical Exam', icon: FileText   },
]

export default function AdminPage() {
  const [tab,          setTab]          = useState('generate')
  const [form,         setForm]         = useState(BLANK)
  const [loading,      setLoading]      = useState(false)
  const [stats,        setStats]        = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleOptionChange = (i, val) => {
    const opts = [...form.options]; opts[i] = val
    setForm({ ...form, options: opts })
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = form.type === 'MCQ'
        ? form
        : { ...form, options: [], correctOption: '' }
      await questionAPI.create(payload)
      toast.success('Question added to bank!')
      setForm(BLANK)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const data = await questionAPI.getStats()
      setStats(data); setTab('stats')
    } catch (err) { toast.error(err.message) }
    finally { setStatsLoading(false) }
  }

  return (
    <AppShell title="Admin Panel" subtitle="Question bank management and AI tools">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
                Question Bank Control
              </p>
              <p className="text-xs text-slate-500">Add, generate and review questions</p>
            </div>
          </div>
          <button onClick={loadStats} disabled={statsLoading} className="btn-secondary text-sm">
            {statsLoading
              ? <><span className="spinner" /> Loading…</>
              : '📊 View bank stats'
            }
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100/80 rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Stats tab ────────────────────────────────────── */}
        {tab === 'stats' && (
          <div className="card animate-fade-in">
            {!stats ? (
              <div className="text-center py-12">
                <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">
                  Click "View bank stats" above to load the overview
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
                    Question Bank Overview
                  </h3>
                  <span className="badge-teal text-sm px-3 py-1">
                    {stats.grandTotal} total questions
                  </span>
                </div>
                <div className="space-y-4">
                  {stats.bySubject.map(s => (
                    <div key={s.subject}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">{s.subject}</span>
                        <span className="text-slate-500 text-xs">
                          {s.total} Qs · {s.topicCount} topics ·
                          MCQ: {s.mcq} Struct: {s.structured} Essay: {s.essay}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill bg-teal-500"
                          style={{ width: `${Math.min((s.total / Math.max(stats.grandTotal, 1)) * 400, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Manual tab ───────────────────────────────────── */}
        {tab === 'manual' && (
          <div className="card animate-fade-in">
            <h3 className="section-title flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600" /> Add Question Manually
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Subject</label>
                  <select name="subject" value={form.subject} onChange={handleChange} className="input">
                    {getSubjectsForExamType(form.examType).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Exam type</label>
                  <div className="flex gap-2">
                    {['WASSCE', 'BECE'].map(t => (
                      <button
                        key={t} type="button"
                        onClick={() => setForm(p => ({
                          ...p,
                          examType: t,
                          subject: getSubjectsForExamType(t).includes(p.subject)
                            ? p.subject
                            : getSubjectsForExamType(t)[0],
                        }))}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                          form.examType === t
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="label">Year</label>
                  <input type="number" name="year" value={form.year}
                    onChange={handleChange} min={2010} max={2025} className="input" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className="input">
                    <option>MCQ</option>
                    <option>Structured</option>
                    <option>Essay</option>
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty (1–5)</label>
                  <input type="number" name="difficulty" value={form.difficulty}
                    onChange={handleChange} min={1} max={5} className="input" />
                </div>
                <div>
                  <label className="label">Marks</label>
                  <input type="number" name="marks" value={form.marks}
                    onChange={handleChange} min={1} className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Topic *</label>
                  <input type="text" name="topic" value={form.topic}
                    onChange={handleChange} placeholder="e.g. Algebra" className="input" required />
                </div>
                <div>
                  <label className="label">Subtopic</label>
                  <input type="text" name="subtopic" value={form.subtopic}
                    onChange={handleChange} placeholder="e.g. Quadratic Equations" className="input" />
                </div>
              </div>

              <div>
                <label className="label">Question text *</label>
                <textarea
                  name="questionText" value={form.questionText}
                  onChange={handleChange} required rows={3}
                  className="input resize-none"
                  placeholder="Enter the full question text..."
                />
              </div>

              {/* MCQ options */}
              {form.type === 'MCQ' && (
                <div>
                  <label className="label">Options</label>
                  <div className="space-y-2">
                    {['A', 'B', 'C', 'D'].map((l, i) => (
                      <div key={l} className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-5 flex-shrink-0 ${form.correctOption === l ? 'text-teal-600' : 'text-slate-400'}`}>
                          {l}.
                        </span>
                        <input
                          type="text" value={form.options[i]}
                          onChange={e => handleOptionChange(i, e.target.value)}
                          className="input flex-1" required
                        />
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, correctOption: l }))}
                          className={`text-xs px-2 py-1.5 rounded-lg transition-colors border ${
                            form.correctOption === l
                              ? 'bg-teal-50 text-teal-700 border-teal-300 font-semibold'
                              : 'text-slate-400 border-slate-200 hover:text-teal-600'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model answer */}
              {form.type !== 'MCQ' && (
                <div>
                  <label className="label">Model answer / marking guide</label>
                  <textarea
                    name="modelAnswer" value={form.modelAnswer}
                    onChange={handleChange} rows={4}
                    className="input resize-none"
                    placeholder="Expected answer and marking points..."
                  />
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading
                  ? <><span className="spinner border-white/40 border-t-white" /> Saving…</>
                  : 'Add to question bank'
                }
              </button>
            </form>
          </div>
        )}

        {/* ── AI Generator tab ─────────────────────────────── */}
        {tab === 'generate' && <AIGeneratorPanel />}

        {/* ── PDF Extractor tab ─────────────────────────────── */}
        {tab === 'pdf' && <PDFExtractorPanel />}
       
        {/* ── Physical Exam tab ──────────────────────────────────── */}
        {tab === 'physical' && <PhysicalExamPanel />}
      </div>
    </AppShell>
  )
}