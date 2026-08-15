import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ── StatCard ───────────────────────────────────────────────────
// KPI card for the analytics dashboard.
// Shows a metric with optional trend direction.
export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconColour = 'bg-teal-100 text-teal-600',
  trend,        // 'up' | 'down' | 'neutral' | null
  trendValue,   // e.g. '+12%'
}) {
  const TrendIcon = trend === 'up' ? TrendingUp
                  : trend === 'down' ? TrendingDown
                  : Minus

  const trendColour = trend === 'up'   ? 'text-green-600 bg-green-50'
                    : trend === 'down' ? 'text-red-500 bg-red-50'
                    : 'text-slate-400 bg-slate-50'

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColour}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendValue && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trendColour}`}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </span>
        )}
      </div>
      <p
        className="text-2xl font-bold text-slate-900 mb-0.5"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {value}
      </p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
    </div>
  )
}