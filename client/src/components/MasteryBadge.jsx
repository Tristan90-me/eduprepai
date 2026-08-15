// ── MasteryBadge ───────────────────────────────────────────────
// Shows a student's mastery level for a topic as a coloured pill.
// Used in the topic picker and question cards.
//
// score:  0-100
// size:   'sm' | 'md'
// showLabel: show the text label alongside the bar

const getMasteryConfig = (score) => {
  if (score === 0)   return { label: 'Not started', colour: 'bg-slate-200 text-slate-500',     bar: 'bg-slate-300'  }
  if (score < 30)    return { label: 'Beginner',    colour: 'bg-red-100 text-red-600',         bar: 'bg-red-400'    }
  if (score < 55)    return { label: 'Developing',  colour: 'bg-amber-100 text-amber-600',     bar: 'bg-amber-400'  }
  if (score < 75)    return { label: 'Competent',   colour: 'bg-blue-100 text-blue-600',       bar: 'bg-blue-500'   }
  if (score < 90)    return { label: 'Proficient',  colour: 'bg-teal-100 text-teal-700',       bar: 'bg-teal-500'   }
  return               { label: 'Mastered',     colour: 'bg-green-100 text-green-700',      bar: 'bg-green-500'  }
}

export default function MasteryBadge({ score = 0, size = 'sm', showLabel = true, showBar = false }) {
  const config = getMasteryConfig(score)

  if (showBar) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          {showLabel && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${config.colour}`}>
              {config.label}
            </span>
          )}
          <span className="text-xs font-semibold text-slate-600 ml-auto">{score}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${config.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full font-medium
      ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'}
      ${config.colour}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.bar}`} />
      {showLabel && config.label}
      {score > 0 && <span className="opacity-70">{score}</span>}
    </span>
  )
}