import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

// ── Custom tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-teal-700">
        {payload[0].value !== null ? `${payload[0].value}%` : 'No data'}
      </p>
      {payload[1] && (
        <p className="text-xs text-slate-500">{payload[1].value} sessions</p>
      )}
    </div>
  )
}

// ── AccuracyChart ──────────────────────────────────────────────
// Weekly accuracy trend line chart using Recharts.
export default function AccuracyChart({ data = [] }) {
  // Fill nulls for display
  const chartData = data.map(d => ({
    ...d,
    accuracyDisplay: d.accuracy,
  }))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title mb-0">7-day accuracy trend</h3>
        <span className="badge-teal text-xs">
          Last 7 days
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={60}
            stroke="#D97706"
            strokeDasharray="4 4"
            label={{ value: 'Pass', position: 'right', fontSize: 10, fill: '#D97706' }}
          />
          <Line
            type="monotone"
            dataKey="accuracyDisplay"
            stroke="#0D9488"
            strokeWidth={2.5}
            dot={{ fill: '#0D9488', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#0D9488' }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Day labels with session counts */}
      <div className="flex justify-between mt-2 px-2">
        {data.map(d => (
          <div key={d.date} className="text-center">
            <div className={`w-1.5 h-1.5 rounded-full mx-auto ${d.sessions > 0 ? 'bg-teal-500' : 'bg-slate-200'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}