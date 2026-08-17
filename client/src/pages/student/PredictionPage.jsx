import { useState, useEffect }  from 'react'
import { useAuth }               from '../../context/AuthContext'
import { predictionAPI }         from '../../api/prediction.api'
import AppShell                  from '../../components/layout/AppShell'
import TopicCard                 from '../../components/TopicCard'
import {
  TrendingUp, RefreshCw, Flame,
  Eye, Thermometer, Binoculars,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Constants ──────────────────────────────────────────────────
const SUBJECTS = [
  'Mathematics', 'English Language', 'Integrated Science', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Economics',
]

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

export default function PredictionPage() {
  const { user } = useAuth()

  const [subject,      setSubject]      = useState(user?.subjects?.[0] || 'Mathematics')
  const [examType,     setExamType]     = useState(user?.examType || 'WASSCE')
  const [predictions,  setPredictions]  = useState([])
  const [loading,      setLoading]      = useState(false)
  const [generatedAt,  setGeneratedAt]  = useState(null)
  const [fromCache,    setFromCache]    = useState(false)
  const [filterTier,   setFilterTier]   = useState('all')
  const [totalQs,      setTotalQs]      = useState(0)

  // ── Load predictions whenever subject or examType changes ──
  useEffect(() => {
    loadPredictions()
  }, [subject, examType])

  const loadPredictions = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const data = await predictionAPI.getForSubject(subject, examType, forceRefresh)
      setPredictions(data.predictions || [])
      setGeneratedAt(data.generatedAt)
      setFromCache(data.fromCache)
      setTotalQs(data.totalQuestionsAnalysed)
    } catch (err) {
      toast.error(err.message)
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    toast('Re-running prediction analysis…', { icon: '🔄' })
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

  // ── Cache timestamp display ────────────────────────────────
  const cacheLabel = generatedAt
    ? `${fromCache ? 'Cached' : 'Generated'} ${new Date(generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })} · ${totalQs} questions analysed`
    : null

  return (
    <AppShell
      title="Topic Predictions"
      subtitle={`AI-powered forecasts from 10 years of past ${examType} papers`}
    >
      <div className="max-w-6xl mx-auto space-y-6">

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
                {(user?.subjects?.length > 0 ? user.subjects : SUBJECTS).map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Exam type toggle */}
            <div>
              <label className="label">Exam type</label>
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
            </div>

            {/* Admin re-run button */}
            {user?.role === 'admin' && (
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Re-run analysis
              </button>
            )}
          </div>

          {/* Cache / generation info */}
          {cacheLabel && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${fromCache ? 'bg-amber-400' : 'bg-green-500'}`} />
              <p className="text-xs text-slate-400">{cacheLabel}</p>
            </div>
          )}
        </div>

        {/* ── Tier summary cards ─────────────────────────────── */}
        {predictions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 stagger-children">
            {TIER_CARDS.map(({ tier, label, sublabel, dot, bg, border, text, ring }) => {
              const count     = tierCounts[tier]
              const isActive  = filterTier === tier

              return (
                <button
                  key={tier}
                  onClick={() => setFilterTier(isActive ? 'all' : tier)}
                  className={`
                    flex flex-col items-center text-center p-4 rounded-xl border-2
                    transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                    ${bg} ${border}
                    ${isActive ? `ring-2 ring-offset-1 ${ring}` : ''}
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className={`text-2xl font-bold ${text}`}
                      style={{ fontFamily: 'var(--font-heading)' }}>
                      {count}
                    </span>
                  </div>
                  <p className={`text-sm font-semibold ${text}`}>{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>
                </button>
              )
            })}
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
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative mb-6">
              <div className="w-14 h-14 border-2 border-teal-100 rounded-full" />
              <div className="w-14 h-14 border-2 border-teal-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
              <TrendingUp className="w-5 h-5 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-600 font-medium text-sm">
              Analysing 10 years of past papers…
            </p>
            <p className="text-slate-400 text-xs mt-1">
              This may take a few seconds on first run
            </p>
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────── */}
        {!loading && predictions.length === 0 && (
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
              Add past questions to the question bank first.
              Predictions are generated automatically once there is enough data.
            </p>
            {user?.role === 'admin' && (
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