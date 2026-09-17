import { useState, useEffect } from 'react'
import AdminShell            from '../../components/layout/AdminShell'
import AIGeneratorPanel      from '../../components/admin/AIGeneratorPanel'
import PDFExtractorPanel     from '../../components/admin/PDFExtractorPanel'
import ManualQuestionForm    from '../../components/ManualQuestionForm'
import { questionAPI }       from '../../api/question.api'
import { predictionAPI }     from '../../api/prediction.api'
import PhysicalExamPanel     from '../../components/admin/PhysicalExamPanel'
import ReviewQueuePanel      from '../../components/admin/ReviewQueuePanel'
import PredictionAccuracyPanel from '../../components/analytics/PredictionAccuracyPanel'
import TopicCard              from '../../components/TopicCard'
import {
  BarChart2, Plus, Cpu, FileSearch, Shield, FileText,
  ClipboardCheck, TrendingUp, RefreshCw, Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubjectsForExamType, GHANAIAN_LANGUAGES } from '../../constants/subjects'

const TABS = [
  { id: 'stats',    label: 'Bank Stats',    icon: BarChart2  },
  { id: 'manual',   label: 'Add Manually',  icon: Plus       },
  { id: 'generate', label: 'AI Generator',  icon: Cpu        },
  { id: 'pdf',      label: 'PDF Extractor', icon: FileSearch },
  { id: 'review',   label: 'Review Queue',  icon: ClipboardCheck },
  { id: 'predictions', label: 'Predictions', icon: TrendingUp },
  { id: 'physical', label: 'Physical Exam', icon: FileText   },
]

export default function AdminPage() {
  const [tab,          setTab]          = useState('generate')
  const [stats,        setStats]        = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // ── Predictions tab — moved here from the shared student page so
  // re-running analysis and logging accuracy is a purely admin action,
  // not something reachable through student-facing chrome. ─────────
  const [predSubject,      setPredSubject]      = useState('Mathematics')
  const [predExamType,     setPredExamType]     = useState('WASSCE')
  const [predictions,      setPredictions]      = useState([])
  const [predLoading,      setPredLoading]      = useState(false)
  const [predGeneratedAt,  setPredGeneratedAt]  = useState(null)
  const [predNotGenerated, setPredNotGenerated] = useState(false)
  const [predTotalQs,      setPredTotalQs]      = useState(0)

  useEffect(() => {
    if (!getSubjectsForExamType(predExamType).includes(predSubject)) {
      setPredSubject(getSubjectsForExamType(predExamType)[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predExamType])

  useEffect(() => {
    if (tab !== 'predictions') return
    loadPredictions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, predSubject, predExamType])

  const loadPredictions = async (forceRefresh = false) => {
    setPredLoading(true)
    try {
      const data = await predictionAPI.getForSubject(predSubject, predExamType, forceRefresh)
      setPredictions(data.predictions || [])
      setPredGeneratedAt(data.generatedAt)
      setPredNotGenerated(!!data.notGenerated)
      setPredTotalQs(data.totalQuestionsAnalysed)
    } catch (err) {
      toast.error(err.message)
      setPredictions([])
    } finally {
      setPredLoading(false)
    }
  }

  const handlePredRefresh = () => {
    toast('Running prediction analysis…', { icon: '🔄' })
    loadPredictions(true)
  }

  const handleManualAdd = async (payload) => {
    try {
      await questionAPI.create(payload)
      toast.success('Question added to bank!')
    } catch (err) {
      toast.error(err.message)
      throw err // let ManualQuestionForm know the add failed (keeps the form filled in)
    }
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
    <AdminShell>
      <div className="max-w-6xl mx-auto space-y-6">

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
            <ManualQuestionForm onAdd={handleManualAdd} submitLabel="Add to question bank" />
          </div>
        )}

        {/* ── AI Generator tab ─────────────────────────────── */}
        {tab === 'generate' && <AIGeneratorPanel />}

        {/* ── PDF Extractor tab ─────────────────────────────── */}
        {tab === 'pdf' && <PDFExtractorPanel />}

        {/* ── Review Queue tab ─────────────────────────────── */}
        {tab === 'review' && <ReviewQueuePanel />}

        {/* ── Predictions tab ──────────────────────────────── */}
        {tab === 'predictions' && (
          <div className="space-y-5 animate-fade-in">
            <div className="card">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-44">
                  <label className="label">Subject</label>
                  <select
                    value={predSubject}
                    onChange={e => setPredSubject(e.target.value)}
                    className="input"
                  >
                    {getSubjectsForExamType(predExamType)
                      .filter(s => !GHANAIAN_LANGUAGES.includes(s))
                      .map(s => <option key={s}>{s}</option>)}
                    {predExamType === 'BECE' && (
                      <optgroup label="Ghanaian Language">
                        {GHANAIAN_LANGUAGES.map(s => <option key={s}>{s}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="label">Exam type</label>
                  <div className="flex gap-2">
                    {['WASSCE', 'BECE'].map(t => (
                      <button
                        key={t}
                        onClick={() => setPredExamType(t)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                          predExamType === t
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePredRefresh}
                  disabled={predLoading}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${predLoading ? 'animate-spin' : ''}`} />
                  {predNotGenerated ? 'Generate predictions' : 'Re-run analysis'}
                </button>
              </div>

              {predGeneratedAt && (
                <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                  Generated {new Date(predGeneratedAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })} · {predTotalQs} questions analysed
                </p>
              )}
            </div>

            <PredictionAccuracyPanel
              subject={predSubject}
              examType={predExamType}
              notGenerated={predNotGenerated}
            />

            {predLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
                <span className="spinner text-teal-500" /> Loading…
              </div>
            )}

            {!predLoading && predNotGenerated && (
              <div className="card text-center py-12 border-dashed border-2 border-slate-200">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No predictions generated yet for {predSubject}.</p>
              </div>
            )}

            {!predLoading && !predNotGenerated && predictions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictions.map(p => (
                  <TopicCard key={p.topic} prediction={p} subject={predSubject} hidePracticeCta />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Physical Exam tab ──────────────────────────────────── */}
        {tab === 'physical' && <PhysicalExamPanel />}
      </div>
    </AdminShell>
  )
}