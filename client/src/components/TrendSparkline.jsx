import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts'

// ── TrendSparkline ─────────────────────────────────────────────
// Compact year-on-year bar chart inside each topic card.
// Coloured bars = appeared that year. Grey = absent.
export default function TrendSparkline({ data = [], trendDirection }) {
  if (!data.length) return null

  // Colour matches our teal brand — rising is green, falling is red, stable is teal
  const barColour =
    trendDirection === 1  ? '#10B981'  // green — rising
    : trendDirection === -1 ? '#EF4444' // red — falling
    : '#0D9488'                          // teal — stable

  return (
    <div className="w-full h-10">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const { year, count } = payload[0].payload
              return (
                <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs shadow-md">
                  <span className="font-semibold text-slate-700">{year}:</span>{' '}
                  <span className="text-slate-500">
                    {count > 0 ? `${count} question${count > 1 ? 's' : ''}` : 'not tested'}
                  </span>
                </div>
              )
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count > 0 ? barColour : '#E2E8F0'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}