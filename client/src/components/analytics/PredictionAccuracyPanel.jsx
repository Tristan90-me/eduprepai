import { useState, useEffect } from 'react'
import { predictionAPI } from '../../api/prediction.api'
import { ShieldCheck, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'

// ── PredictionAccuracyPanel ─────────────────────────────────────
// Admin-only. Lets an admin log what topics actually appeared on a
// real exam (compared automatically against the engine's "hot"
// predictions) and browse that accuracy history over time. Uses
// endpoints that already existed server-side but had no UI.
export default function PredictionAccuracyPanel({ subject, examType, notGenerated }) {
  const [expanded,   setExpanded]   = useState(false)
  const [history,    setHistory]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [examYear,     setExamYear]     = useState(new Date().getFullYear())
  const [topicsInput,  setTopicsInput]  = useState('')

  useEffect(() => {
    if (!expanded) return
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, examType, expanded])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await predictionAPI.getHistory(subject, examType)
      setHistory(data.accuracyLog || [])
    } catch {
      // 404 "no history yet" is the normal case for a subject that's
      // never had accuracy logged — not a real error.
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const actualTopics = topicsInput.split(',').map(t => t.trim()).filter(Boolean)

    if (!examYear) return toast.error('Enter the exam year')
    if (actualTopics.length === 0) return toast.error('Enter at least one topic')

    setSubmitting(true)
    try {
      const data = await predictionAPI.logAccuracy({
        subject, examType, examYear: Number(examYear), actualTopics,
      })
      toast.success(data.message)
      setTopicsInput('')
      loadHistory()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const accuracyBadge = (pct) =>
    pct >= 70 ? 'badge-green' : pct >= 40 ? 'badge-amber' : 'badge-red'

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.loggedAt) - new Date(a.loggedAt)
  )

  return (
    <div className="rounded-xl border-2 border-slate-800 overflow-hidden">

      {/* Header — slate/amber admin palette, distinct from the page's teal */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-800 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
              Prediction accuracy — admin only
            </p>
            <p className="text-slate-400 text-xs">Log real exam results and track engine accuracy over time</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="bg-white p-5 space-y-5 animate-fade-in">

          {notGenerated ? (
            <p className="text-sm text-slate-500">
              No predictions have been generated for {subject} yet — generate them first, then come back here to log real exam results against them.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="label">Exam year</label>
                  <input
                    type="number" value={examYear}
                    onChange={e => setExamYear(e.target.value)}
                    min={2010} max={2030} className="input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Topics that actually appeared</label>
                  <input
                    type="text" value={topicsInput}
                    onChange={e => setTopicsInput(e.target.value)}
                    placeholder="e.g. Quadratic Equations, Trigonometry, Probability"
                    className="input"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">Separate topics with commas.</p>
              <button type="submit" disabled={submitting} className="btn-primary text-sm">
                {submitting
                  ? <><span className="spinner border-white/40 border-t-white" /> Logging…</>
                  : <><ClipboardList className="w-4 h-4" /> Log accuracy</>
                }
              </button>
            </form>
          )}

          <div className="divider" />

          {loading ? (
            <p className="text-sm text-slate-400">Loading history…</p>
          ) : sortedHistory.length === 0 ? (
            <p className="text-sm text-slate-400">No accuracy logged yet for {subject}.</p>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((entry, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {entry.examYear} exam
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={accuracyBadge(entry.accuracyPercent)}>
                        {entry.accuracyPercent}% accurate
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(entry.loggedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-xs text-slate-400 mr-1">Predicted (hot):</span>
                      {entry.predictedTopics.map(t => (
                        <span key={t} className="badge-teal text-xs">{t}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-xs text-slate-400 mr-1">Actually appeared:</span>
                      {entry.actualTopics.map(t => (
                        <span key={t} className="badge-gray text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
