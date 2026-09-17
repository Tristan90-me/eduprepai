import { Star } from 'lucide-react'
import { scoreToStars } from './MasteryBadge'

// ── StarRating ───────────────────────────────────────────────────
// Renders a 0-5 star rating for a topic's mastery. Pass either a
// pre-computed `stars` (0-5) or a raw `score` (0-100) to derive it
// from — used on the Session Path so a topic's progress reads at a
// glance instead of as a percentage.
export default function StarRating({ score, stars, size = 'sm' }) {
  const filled = stars ?? scoreToStars(score ?? 0)
  const dim = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'

  return (
    <div className="flex items-center gap-0.5" aria-label={`${filled} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${dim} ${i <= filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-300'}`}
        />
      ))}
    </div>
  )
}
