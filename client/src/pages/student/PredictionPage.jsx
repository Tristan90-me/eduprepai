import { useState, useEffect }  from 'react'
import { useNavigate }           from 'react-router-dom'
import { useAuth }               from '../../context/AuthContext'
import { predictionAPI }         from '../../api/prediction.api'
import AppShell                  from '../../components/layout/AppShell'
import TopicCard                 from '../../components/TopicCard'
import SkeletonTopicCard         from '../../components/SkeletonTopicCard'
import PredictionAccuracyPanel   from '../../components/analytics/PredictionAccuracyPanel'
import useCountUp                from '../../hooks/useCountUp'
import {
  TrendingUp, RefreshCw, Flame,
  Eye, Thermometer, Binoculars,
  Sparkles, Info, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubjectsForExamType } from '../../constants/subjects'

const TIERS = [
  { key: 'all',  label: 'All',       icon: Eye         },
  { key: 'hot',  label: 'Hot',       icon: Flame       },
  { key: 'warm', label: 'Warm',      icon: Thermometer },
  { key: 'watch',label: 'Watch',     icon: Binoculars  },
]

// ── Tier summary card config ───────────────────────────────────
const TIER_CARDS = [
  {
    tier:    'hot',
    label:   'Hot topics',
    sublabel:'Very likely to appear',
    dot:     'bg-red-500',
    bg:      'bg-red-50',
    border:  'border-red-200',
    text:    'text-red-700',
    ring:    'ring-red-400',
  },
  {
    tier:    'warm',
    label:   'Warm topics',
    sublabel:'Likely to appear',
    dot:     'bg-amber-500',
    bg:      'bg-amber-50',
    border:  'border-amber-200',
    text:    'text-amber-700',
    ring:    'ring-amber-400',
  },
  {
    tier:    'watch',
    label:   'Watch topics',
    sublabel:'Possible appearance',
    dot:     'bg-teal-500',
    bg:      'bg-teal-50',
    border:  'border-teal-200',
    text:    'text-teal-700',
    ring:    'ring-teal-400',
  },
]

// ── TierSummaryCard ──────────────────────────────────────────────
// Split out so useCountUp (a hook) isn't called inside a .map() callback.
function TierSummaryCard({ label, sublabel, dot, bg, border, text, ring, count, isActive, onClick }) {
  const animatedCount = useCountUp(count)
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center text-center p-4 rounded-xl border-2
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${bg} ${border}
        ${isActive ? `ring-2 ring-offset-1 ${ring}` : ''}
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className={`text-2xl font-bold ${text}`} style={{ fontFamily: 'var(--font-heading)' }}>
          {animatedCount}
        </span>
      </div>
      <p className={`text-sm font-semibold ${text}`}>{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>
    </button>
  )
}

const daysUntil = (dateStr) => {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}

export default function PredictionPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const isAdmin = user?.role === 'admin'

  // ── Exam type ────────────────────────────────────────────────
  // Students are locked to their own registered exam type — a WASSCE
  // student cannot browse BECE predictions and vice versa. Admins
  // manage content for both exam types, so they keep the toggle.
  const [examType,     setExamType]     = useState(user?.examType || 'WASSCE')
  const [subject,      setSubject]      = useState(
    user?.subjects?.[0] || getSubjectsForExamType(user?.examType || 'WASSCE')[0]
  )
  const [predictions,  setPredictions]  = useState([])
  const [loading,      setLoading]      = useState(false)
  const [generatedAt,  setGeneratedAt]  = useState(null)
  const [fromCache,    setFromCache]    = useState(false)
  const [stale,        setStale]        = useState(false)
  const [notGenerated, setNotGenerated] = useState(false)
  const [cacheExpiresAt, setCacheExpiresAt] = useState(null)
  const [filterTier,   setFilterTier]   = useState('all')
  const [totalQs,      setTotalQs]      = useState(0)
  const [explainerOpen, setExplainerOpen] = useState(false)

  const subjectOptions = isAdmin
    ? getSubjectsForExamType(examType)
    : (user?.subjects?.length > 0 ? user.subjects : getSubjectsForExamType(examType))

  // ── Admin switching exam type — keep subject valid for the list ─
  useEffect(() => {
    if (isAdmin && !subjectOptions.includes(subject)) {
      setSubject(subjectOptions[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examType])

  // ── Load predictions whenever subject or examType changes ──
  // This never generates — it only checks the cache. Generation is
  // always an explicit action (see handleRefresh) so visiting the
  // page never silently spends an AI call.
  useEffect(() => {
    loadPredictions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, examType])

  const loadPredictions = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const data = await predictionAPI.getForSubject(subject, examType, forceRefresh)
      setPredictions(data.predictions || [])
      setGeneratedAt(data.generatedAt)
      setFromCache(data.fromCache)
      setStale(!!data.stale)
      setNotGenerated(!!data.notGenerated)
      setCacheExpiresAt(data.cacheExpiresAt)
      setTotalQs(data.totalQuestionsAnalysed)
    } catch (err) {
      toast.error(err.message)
      setPredictions([])
      // Don't leave a stale "not generated" CTA showing after a real
      // error (e.g. not enough questions in the bank) — that has its
      // own explanation via the toast and the default empty state.
      setNotGenerated(false)
      setStale(false)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    toast('Running prediction analysis…', { icon: '🔄' })
    loadPredictions(true)
  }

  // ── Derived values ─────────────────────────────────────────
  const filtered   = filterTier === 'all'
    ? predictions
    : predictions.filter(p => p.tier === filterTier)

  const hotCount   = predictions.filter(p => p.tier === 'hot').length
  const warmCount  = predictions.filter(p => p.tier === 'warm').length
  const watchCount = predictions.filter(p => p.tier === 'watch').length

  const tierCounts = { hot: hotCount, warm: warmCount, watch: watchCount }

  const heroTopics = [...(hotCount >= 2 ? predictions.filter(p => p.tier === 'hot') : predictions)]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)

  // ── Cache timestamp display ────────────────────────────────
  const refreshInfo = !cacheExpiresAt
    ? ''
    : stale
      ? ' · Cache expired — refresh for the latest analysis'
      : ` · Refreshes in ${daysUntil(cacheExpiresAt)} day${daysUntil(cacheExpiresAt) !== 1 ? 's' : ''}`

  const cacheLabel = generatedAt
    ? `${fromCache ? 'Cached' : 'Generated'} ${new Date(generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })} · ${totalQs} questions analysed${refreshInfo}`
    : null

  const actionLabel = isAdmin ? 'Re-run analysis' : notGenerated ? 'Generate predictions' : 'Refresh predictions'

  return (
    <AppShell
      title="Topic Predictions"
      subtitle={`AI-powered forecasts from 10 years of past ${examType} papers`}
    >
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Focus this week hero ─────────────────────────────── */}
        {!loading && heroTopics.length > 0 && (
          <div className="card bg-gradient-to-r from-teal-50 to-white border-teal-200 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h2 className="font-semibold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
                Focus this week
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {heroTopics.map(t => (
                <button
                  key={t.topic}
                  onClick={() => navigate(`/practice?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(t.topic)}`)}
                  className="text-left bg-white border border-teal-100 rounded-xl px-4 py-3 hover:border-teal-300 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-sm text-slate-800 truncate">{t.topic}</p>
                  <p className="text-xs text-teal-600 font-semibold mt-0.5">{t.confidence}% confidence</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Controls card ─────────────────────────────────── */}
        <div className="card">
          <div className="flex flex-wrap gap-4 items-end">

            {/* Subject selector */}
            <div className="flex-1 min-w-44">
              <label className="label">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="input"
              >
                {subjectOptions.map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Exam type — admins can browse either type; students are
               locked to their own registered exam type */}
            <div>
              <label className="label">Exam type</label>
              {isAdmin ? (
                <div className="flex gap-2">
                  {['WASSCE', 'BECE'].map(type => (
                    <button
                      key={type}
                      onClick={() => setExamType(type)}
                      className={`
                        px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all
                        ${examType === type
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                        }
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="badge-teal px-4 py-2.5 text-sm">{examType}</span>
              )}
            </div>

            {/* Generate / re-run action — only shown once there's
               something to act on. Before that, the single CTA in the
               "not generated yet" empty state below is the only way
               to trigger analysis, so it's never ambiguous whether
               something has already run. Admins can always re-run
               once results exist (fresh or stale); students only see
               this when the cache is missing or stale. */}
            {(isAdmin ? !notGenerated : (notGenerated || stale)) && (
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {actionLabel}
              </button>
            )}
          </div>

          {/* Cache / generation info */}
          {cacheLabel && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                stale ? 'bg-orange-400 animate-pulse-soft' : fromCache ? 'bg-amber-400' : 'bg-green-500'
              }`} />
              <p className="text-xs text-slate-400">{cacheLabel}</p>
            </div>
          )}
        </div>

        {/* ── How predictions work (collapsible) ──────────────── */}
        <div className="card">
          <button
            onClick={() => setExplainerOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-600" />
              <span className="font-semibold text-sm text-slate-800">How predictions work</span>
            </div>
            {explainerOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {explainerOpen && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600 animate-fade-in">
              <p>Each topic is scored using four signals drawn from 10 years of past papers:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li><span className="font-medium text-slate-700">Frequency</span> — how many years it has appeared</li>
                <li><span className="font-medium text-slate-700">Recency</span> — how recently it was tested, weighted toward recent years</li>
                <li><span className="font-medium text-slate-700">Gap</span> — how long since it last appeared ("due" topics score higher)</li>
                <li><span className="font-medium text-slate-700">Trend</span> — whether it's appearing more or less often lately</li>
              </ul>
              <p>
                Topics are grouped into tiers: <span className="font-medium text-red-600">Hot</span> (70%+ confidence),{' '}
                <span className="font-medium text-amber-600">Warm</span> (45%+), and{' '}
                <span className="font-medium text-teal-600">Watch</span> (below that). Results are cached for 7 days
                and shared across every student studying the same subject.
              </p>
            </div>
          )}
        </div>

        {/* ── Admin-only accuracy panel ─────────────────────────── */}
        {isAdmin && (
          <PredictionAccuracyPanel subject={subject} examType={examType} notGenerated={notGenerated} />
        )}

        {/* ── Tier summary cards ─────────────────────────────── */}
        {predictions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 stagger-children">
            {TIER_CARDS.map(cfg => (
              <TierSummaryCard
                key={cfg.tier}
                {...cfg}
                count={tierCounts[cfg.tier]}
                isActive={filterTier === cfg.tier}
                onClick={() => setFilterTier(filterTier === cfg.tier ? 'all' : cfg.tier)}
              />
            ))}
          </div>
        )}

        {/* ── Filter pills ───────────────────────────────────── */}
        {predictions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {TIERS.map(({ key, label, icon: Icon }) => {
              const count   = key === 'all' ? predictions.length : tierCounts[key]
              const isActive = filterTier === key

              return (
                <button
                  key={key}
                  onClick={() => setFilterTier(key)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                    font-medium border transition-all duration-200
                    ${isActive
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                    }
                  `}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                  <span className={`
                    px-1.5 py-0.5 rounded-full text-xs font-bold
                    ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}
                  `}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Loading state ──────────────────────────────────── */}
        {loading && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="spinner text-teal-600" />
              {notGenerated || predictions.length === 0 ? 'Checking for predictions…' : 'Refreshing…'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonTopicCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Not generated yet — explicit CTA for everyone ───── */}
        {!loading && notGenerated && (
          <div className="card text-center py-16 border-dashed border-2 border-slate-200 animate-fade-in">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-teal-500" />
            </div>
            <h3
              className="font-semibold text-slate-700 mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Predictions haven't been generated yet
            </h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Be the first to run the AI analysis for {subject} — it only takes a few seconds.
            </p>
            <button onClick={handleRefresh} className="btn-primary mt-5 mx-auto">
              {isAdmin ? 'Run analysis now' : 'Generate predictions'}
            </button>
            {!isAdmin && (
              <p className="text-xs text-slate-400 mt-3 max-w-sm mx-auto">
                Shared across every {examType} student studying {subject} — results are cached for 7 days.
              </p>
            )}
          </div>
        )}

        {/* ── Empty state (not enough data in the bank) ───────── */}
        {!loading && !notGenerated && predictions.length === 0 && (
          <div className="card text-center py-16 border-dashed border-2 border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-slate-400" />
            </div>
            <h3
              className="font-semibold text-slate-700 mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              No predictions yet
            </h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Add more past questions to the question bank first — at least 5 are needed to run the analysis.
            </p>
            {isAdmin && (
              <button
                onClick={handleRefresh}
                className="btn-primary mt-5 mx-auto"
              >
                Run analysis now
              </button>
            )}
          </div>
        )}

        {/* ── No results for filter ──────────────────────────── */}
        {!loading && predictions.length > 0 && filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-slate-500 text-sm font-medium">
              No {filterTier} topics found
            </p>
            <button
              onClick={() => setFilterTier('all')}
              className="btn-secondary mt-3 text-sm"
            >
              Show all topics
            </button>
          </div>
        )}

        {/* ── Topic cards grid ───────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {filtered.map(prediction => (
              <TopicCard
                key={prediction.topic}
                prediction={prediction}
                subject={subject}
              />
            ))}
          </div>
        )}

      </div>
    </AppShell>
  )
}
