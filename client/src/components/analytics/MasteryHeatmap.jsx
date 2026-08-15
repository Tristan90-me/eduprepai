import MasteryBadge from '../MasteryBadge'

// ── MasteryHeatmap ─────────────────────────────────────────────
// Grid of topic mastery scores, grouped by subject.
// Each cell is colour-coded by mastery level.
export default function MasteryHeatmap({ data = [], selectedSubject }) {
  const filtered = selectedSubject
    ? data.filter(d => d.subject === selectedSubject)
    : data

  // Group by subject
  const bySubject = filtered.reduce((map, d) => {
    if (!map[d.subject]) map[d.subject] = []
    map[d.subject].push(d)
    return map
  }, {})

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No mastery data yet. Complete some practice sessions to see your topic mastery here.
      </div>
    )
  }

  const getCell = (score) => {
    if (score === 0)  return 'bg-slate-100 text-slate-400'
    if (score < 30)   return 'bg-red-100 text-red-700'
    if (score < 55)   return 'bg-amber-100 text-amber-700'
    if (score < 75)   return 'bg-blue-100 text-blue-700'
    if (score < 90)   return 'bg-teal-100 text-teal-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <div className="space-y-5">
      {Object.entries(bySubject).map(([subject, topics]) => (
        <div key={subject}>
          <div className="flex items-center gap-2 mb-2.5">
            <p className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'var(--font-heading)' }}>
              {subject}
            </p>
            <span className="text-xs text-slate-400">
              {topics.filter(t => t.score >= 70).length}/{topics.length} mastered
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {topics.sort((a, b) => b.score - a.score).map(t => (
              <div
                key={t.topic}
                className={`px-3 py-2 rounded-xl ${getCell(t.score)} transition-all`}
                title={`${t.topic}: ${t.score}% mastery`}
              >
                <p className="text-xs font-medium truncate">{t.topic}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold tabular-nums">{t.score}%</span>
                  <span className="text-xs opacity-60">{t.attempts}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-3 pt-2 flex-wrap">
        <span className="text-xs text-slate-400">Mastery:</span>
        {[
          { label: 'Not started', colour: 'bg-slate-100' },
          { label: 'Beginner',    colour: 'bg-red-100'   },
          { label: 'Developing',  colour: 'bg-amber-100' },
          { label: 'Competent',   colour: 'bg-blue-100'  },
          { label: 'Proficient',  colour: 'bg-teal-100'  },
          { label: 'Mastered',    colour: 'bg-green-100' },
        ].map(({ label, colour }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${colour}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}