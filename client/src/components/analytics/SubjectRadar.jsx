import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'

// ── SubjectRadar ───────────────────────────────────────────────
// Radar chart showing performance across subjects.
export default function SubjectRadar({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Complete practice sessions across subjects to see your radar chart.
      </div>
    )
  }

  const chartData = data.map(d => ({
    subject:  d.subject.split(' ')[0],  // first word only for space
    accuracy: d.averageAccuracy,
    mastery:  d.avgMastery,
  }))

  return (
    <div className="card">
      <h3 className="section-title">Subject performance radar</h3>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip
            formatter={(val, name) => [`${val}%`, name === 'accuracy' ? 'Accuracy' : 'Mastery']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
          />
          <Radar
            name="accuracy"
            dataKey="accuracy"
            stroke="#0D9488"
            fill="#0D9488"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Radar
            name="mastery"
            dataKey="mastery"
            stroke="#D97706"
            fill="#D97706"
            fillOpacity={0.1}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 justify-center mt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-3 h-0.5 bg-teal-500 rounded" />
          Accuracy
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-3 h-0.5 bg-amber-500 rounded border-dashed" style={{ borderBottom: '2px dashed #D97706' }} />
          Mastery
        </div>
      </div>
    </div>
  )
}