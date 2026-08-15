import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts'

// ── TrendSparkline ─────────────────────────────────────────────
// Receives yearlyFrequency: [{ year: 2015, count: 1 }, ...]
// Renders as a compact bar chart — green bars = appeared, gray = absent
export default function TrendSparkline({ data = [], trendDirection }) {
  if (!data.length) return null

  const trendColour = trendDirection === 1  ? '#10B981'   // rising  → green
                    : trendDirection === -1 ? '#EF4444'   // falling → red
                    :                        '#6366F1'    // stable  → indigo

  return (
    <div className="w-full h-12">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const { year, count } = payload[0].payload
              return (
                <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs shadow">
                  <span className="font-medium">{year}:</span>{' '}
                  {count > 0 ? `${count} question${count > 1 ? 's' : ''}` : 'not tested'}
                </div>
              )
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count > 0 ? trendColour : '#E5E7EB'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}