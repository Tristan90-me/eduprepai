import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { predictionAPI } from '../../api/prediction.api'
import TopicCard from '../../components/TopicCard'
import toast from 'react-hot-toast'

const SUBJECTS = [
  'Mathematics', 'English Language', 'Integrated Science', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Economics',
]

const TIERS = ['all', 'hot', 'warm', 'watch']

export default function PredictionPage() {
  const { user } = useAuth()

  const [subject,     setSubject]     = useState(user?.subjects?.[0] || 'Mathematics')
  const [examType,    setExamType]    = useState(user?.examType || 'WASSCE')
  const [predictions, setPredictions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [generatedAt, setGeneratedAt] = useState(null)
  const [fromCache,   setFromCache]   = useState(false)
  const [filterTier,  setFilterTier]  = useState('all')
  const [totalQs,     setTotalQs]     = useState(0)

  // Load predictions whenever subject or examType changes
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
    toast('Re-running analysis…', { icon: '🔄' })
    loadPredictions(true)
  }

  // Apply tier filter
  const filtered = filterTier === 'all'
    ? predictions
    : predictions.filter(p => p.tier === filterTier)

  const hotCount  = predictions.filter(p => p.tier === 'hot').length
  const warmCount = predictions.filter(p => p.tier === 'warm').length
  const watchCount = predictions.filter(p => p.tier === 'watch').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Topic Predictions</h1>
          <p className="text-gray-500 text-sm mt-1">
            AI-powered topic forecasts based on 10 years of past {examType} papers
          </p>
        </div>

        {/* Controls */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-end">

            {/* Subject selector */}
            <div className="flex-1 min-w-40">
              <label className="label">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="input"
              >
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Exam type */}
            <div>
              <label className="label">Exam type</label>
              <div className="flex gap-2">
                {['WASSCE', 'BECE'].map(type => (
                  <button
                    key={type}
                    onClick={() => setExamType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition
                      ${examType === type
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh button (admin only) */}
            {user?.role === 'admin' && (
              <button onClick={handleRefresh} className="btn-secondary">
                Re-run analysis
              </button>
            )}
          </div>

          {/* Cache info */}
          {generatedAt && (
            <p className="text-xs text-gray-400 mt-3">
              {fromCache ? 'Served from cache · ' : 'Freshly generated · '}
              {new Date(generatedAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
              {' · '}{totalQs} questions analysed
            </p>
          )}
        </div>

        {/* Summary counters */}
        {predictions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { tier: 'hot',   label: 'Hot topics',   count: hotCount,   color: 'text-red-600',   bg: 'bg-red-50'   },
              { tier: 'warm',  label: 'Warm topics',  count: warmCount,  color: 'text-amber-600', bg: 'bg-amber-50' },
              { tier: 'watch', label: 'Watch topics', count: watchCount, color: 'text-green-600', bg: 'bg-green-50' },
            ].map(({ tier, label, count, color, bg }) => (
              <button
                key={tier}
                onClick={() => setFilterTier(filterTier === tier ? 'all' : tier)}
                className={`card text-center transition hover:shadow-md
                  ${filterTier === tier ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </button>
            ))}
          </div>
        )}

        {/* Tier filter pills */}
        {predictions.length > 0 && (
          <div className="flex gap-2 mb-6">
            {TIERS.map(t => (
              <button
                key={t}
                onClick={() => setFilterTier(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition capitalize
                  ${filterTier === t
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
                  }`}
              >
                {t === 'all' ? `All (${predictions.length})` : t}
              </button>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Analysing 10 years of past papers…</p>
            <p className="text-gray-400 text-xs mt-1">This may take a few seconds on first run</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && predictions.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-gray-500 font-medium">No predictions available yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Add past questions to the question bank first, then predictions will be generated automatically.
            </p>
          </div>
        )}

        {/* Topic cards grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  )
}