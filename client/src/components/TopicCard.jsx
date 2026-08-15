import { useNavigate } from 'react-router-dom'
import TrendSparkline from './TrendSparkline'

// ── Tier config — colours and labels for hot/warm/watch ───────
const TIER = {
  hot:   { label: 'Very likely', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200'    },
  warm:  { label: 'Likely',      dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  watch: { label: 'Possible',    dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
}

const TREND_LABEL = { 1: '↑ Rising', 0: '→ Stable', '-1': '↓ Falling' }
const TREND_COLOR = { 1: 'text-green-600', 0: 'text-gray-500', '-1': 'text-red-500' }

export default function TopicCard({ prediction, subject }) {
  const navigate = useNavigate()
  const tier     = TIER[prediction.tier] || TIER.watch

  const handlePractice = () => {
    // Navigate to practice page pre-filtered for this topic
    navigate(`/practice?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(prediction.topic)}`)
  }

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">

      {/* Header row — topic name + tier badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tier.dot}`} />
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
            {prediction.topic}
          </h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${tier.badge}`}>
          {tier.label}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Confidence</span>
          <span className="font-semibold text-gray-800">{prediction.confidence}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${prediction.confidence}%`,
              backgroundColor: prediction.tier === 'hot'   ? '#EF4444'
                             : prediction.tier === 'warm'  ? '#F59E0B'
                             : '#10B981',
            }}
          />
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-1">Year-on-year frequency</p>
        <TrendSparkline
          data={prediction.yearlyFrequency}
          trendDirection={prediction.trendDirection}
        />
      </div>

      {/* Meta row — trend, last seen, section forecast */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <span className={`font-medium ${TREND_COLOR[prediction.trendDirection]}`}>
          {TREND_LABEL[prediction.trendDirection]}
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">Last seen: {prediction.latestYear}</span>
        {prediction.sectionForecast && (
          <>
            <span className="text-gray-400">·</span>
            <span className="text-indigo-600 font-medium">
              Section {prediction.sectionForecast.section} · {prediction.sectionForecast.expectedMarks} marks
            </span>
          </>
        )}
      </div>

      {/* Cluster topics */}
      {prediction.clusters?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-1">Often tested with</p>
          <div className="flex flex-wrap gap-1">
            {prediction.clusters.map(c => (
              <span key={c}
                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI reasoning */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <p className="text-xs text-gray-400 mb-1 font-medium">AI analysis</p>
        <p className="text-xs text-gray-600 leading-relaxed">{prediction.aiReasoning}</p>
      </div>

      {/* Examiner style hint */}
      {prediction.examinerStyleHint && (
        <div className="border-l-2 border-indigo-300 pl-3 mb-4">
          <p className="text-xs text-gray-400 mb-0.5">Examiner style hint</p>
          <p className="text-xs text-indigo-700 italic">{prediction.examinerStyleHint}</p>
        </div>
      )}

      {/* Practice button */}
      <button
        onClick={handlePractice}
        className="w-full btn-primary text-xs py-2"
      >
        Practice this topic
      </button>
    </div>
  )
}