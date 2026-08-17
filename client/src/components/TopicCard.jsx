import { useNavigate } from 'react-router-dom'
import TrendSparkline from './TrendSparkline'
import { TrendingUp, TrendingDown, Minus, BookOpen, ChevronRight, Layers } from 'lucide-react'

// ── Tier configuration — consistent with our teal brand ────────
const TIER_CONFIG = {
  hot: {
    label:      'Very likely',
    dot:        'bg-red-500',
    badge:      'bg-red-50 text-red-700 border-red-200',
    bar:        'bg-red-500',
    glow:       'border-red-200',
  },
  warm: {
    label:      'Likely',
    dot:        'bg-amber-500',
    badge:      'bg-amber-50 text-amber-700 border-amber-200',
    bar:        'bg-amber-500',
    glow:       'border-amber-200',
  },
  watch: {
    label:      'Possible',
    dot:        'bg-teal-500',
    badge:      'bg-teal-50 text-teal-700 border-teal-200',
    bar:        'bg-teal-500',
    glow:       'border-teal-200',
  },
}

const TREND_CONFIG = {
  1:    { icon: TrendingUp,   colour: 'text-green-600', label: 'Rising'  },
  0:    { icon: Minus,        colour: 'text-slate-400', label: 'Stable'  },
  '-1': { icon: TrendingDown, colour: 'text-red-500',   label: 'Falling' },
}

export default function TopicCard({ prediction, subject }) {
  const navigate = useNavigate()
  const tier     = TIER_CONFIG[prediction.tier] || TIER_CONFIG.watch
  const trend    = TREND_CONFIG[prediction.trendDirection] || TREND_CONFIG[0]
  const TrendIcon = trend.icon

  const handlePractice = () => {
    navigate(
      `/practice?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(prediction.topic)}`
    )
  }

  return (
    <div className={`
      bg-white rounded-xl border-2 shadow-sm p-5
      hover:shadow-md hover:-translate-y-0.5
      transition-all duration-200 flex flex-col gap-4
      ${tier.glow}
    `}>

      {/* ── Header: topic name + tier badge ────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tier.dot}`} />
          <h3
            className="font-semibold text-slate-900 text-sm leading-snug truncate"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {prediction.topic}
          </h3>
        </div>
        <span className={`
          inline-flex items-center text-xs font-medium px-2 py-0.5
          rounded-full border flex-shrink-0
          ${tier.badge}
        `}>
          {tier.label}
        </span>
      </div>

      {/* ── Confidence bar ──────────────────────────────────── */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-400 font-medium">Confidence</span>
          <span className="text-sm font-bold text-slate-800 tabular-nums">
            {prediction.confidence}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${tier.bar}`}
            style={{ width: `${prediction.confidence}%` }}
          />
        </div>
      </div>

      {/* ── Sparkline ───────────────────────────────────────── */}
      <div>
        <p className="text-xs text-slate-400 mb-1.5 font-medium">
          Year-on-year frequency
        </p>
        <TrendSparkline
          data={prediction.yearlyFrequency}
          trendDirection={prediction.trendDirection}
        />
      </div>

      {/* ── Meta row: trend · last seen · section forecast ─── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className={`flex items-center gap-1 font-medium ${trend.colour}`}>
          <TrendIcon className="w-3 h-3" />
          {trend.label}
        </span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-500">Last seen: <span className="font-medium text-slate-700">{prediction.latestYear}</span></span>
        {prediction.sectionForecast && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-teal-600 font-semibold">
              Sec {prediction.sectionForecast.section} · {prediction.sectionForecast.expectedMarks}m
            </span>
          </>
        )}
      </div>

      {/* ── Cluster topics ──────────────────────────────────── */}
      {prediction.clusters?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Layers className="w-3 h-3 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium">Often tested with</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {prediction.clusters.map(c => (
              <span key={c} className="badge-teal text-xs">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── AI reasoning ────────────────────────────────────── */}
      {prediction.aiReasoning && (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
            AI analysis
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {prediction.aiReasoning}
          </p>
        </div>
      )}

      {/* ── Examiner style hint ─────────────────────────────── */}
      {prediction.examinerStyleHint && (
        <div className="border-l-2 border-teal-300 pl-3">
          <p className="text-xs text-slate-400 font-medium mb-0.5">Examiner style hint</p>
          <p className="text-xs text-teal-700 italic leading-relaxed">
            {prediction.examinerStyleHint}
          </p>
        </div>
      )}

      {/* ── Practice CTA ────────────────────────────────────── */}
      <button
        onClick={handlePractice}
        className="mt-auto btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Practice this topic
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}