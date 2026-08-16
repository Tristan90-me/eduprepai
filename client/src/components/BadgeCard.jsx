// ── Colour map — badge colour → Tailwind classes ───────────────
const COLOUR_MAP = {
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   ring: 'ring-teal-300'   },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   ring: 'ring-blue-300'   },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  ring: 'ring-amber-300'  },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', ring: 'ring-orange-300' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  ring: 'ring-green-300'  },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', ring: 'ring-purple-300' },
  gold:   { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-800',  ring: 'ring-amber-400'  },
}

// ── BadgeCard ──────────────────────────────────────────────────
// Renders a single badge as a card.
// Locked badges are shown greyed out with a lock icon.
// Used in the Settings page badge showcase and the profile widget.
export default function BadgeCard({ badge, size = 'md', showDescription = true }) {
  const colours = COLOUR_MAP[badge.colour] || COLOUR_MAP.teal
  const isLarge = size === 'lg'

  if (!badge.earned) {
    // Locked state
    return (
      <div className={`
        flex flex-col items-center text-center p-3 rounded-xl border-2
        border-dashed border-slate-200 bg-slate-50 opacity-50
        ${isLarge ? 'p-5' : 'p-3'}
      `}>
        <div className={`rounded-full bg-slate-200 flex items-center justify-center mb-2 ${isLarge ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-lg'}`}>
          🔒
        </div>
        <p className={`font-semibold text-slate-400 ${isLarge ? 'text-sm' : 'text-xs'}`}>
          {badge.name}
        </p>
        {showDescription && (
          <p className="text-xs text-slate-300 mt-0.5 leading-tight">{badge.description}</p>
        )}
      </div>
    )
  }

  // Earned state
  return (
    <div className={`
      flex flex-col items-center text-center rounded-xl border-2
      ${colours.bg} ${colours.border}
      transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
      ${isLarge ? 'p-5' : 'p-3'}
    `}>
      <div className={`
        rounded-full ring-4 ${colours.ring} ring-opacity-30
        flex items-center justify-center mb-2
        ${isLarge ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-lg'}
        ${colours.bg}
      `}>
        <span role="img" aria-label={badge.name}>{badge.icon}</span>
      </div>
      <p className={`font-semibold ${colours.text} ${isLarge ? 'text-sm' : 'text-xs'}`}>
        {badge.name}
      </p>
      {showDescription && (
        <p className={`text-slate-500 mt-0.5 leading-tight ${isLarge ? 'text-xs' : 'text-xs'}`}>
          {badge.description}
        </p>
      )}
    </div>
  )
}