import { useEffect, useState, useRef } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

// ── ExamTimer ──────────────────────────────────────────────────
// Countdown timer for the mock exam.
// Shows warning colours as time runs low.
// Calls onTimeUp() when timer reaches zero.
export default function ExamTimer({
  totalMinutes = 160,
  startedAt,
  onTimeUp,
}) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!startedAt) return totalMinutes * 60

    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    return Math.max(0, totalMinutes * 60 - elapsed)
  })

  const calledTimeUp = useRef(false)

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!calledTimeUp.current) {
        calledTimeUp.current = true
        onTimeUp?.()
      }
      return
    }

    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(interval)
          if (!calledTimeUp.current) {
            calledTimeUp.current = true
            onTimeUp?.()
          }
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const hours   = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60

  const isWarning  = secondsLeft <= 15 * 60  // under 15 mins
  const isCritical = secondsLeft <= 5 * 60   // under 5 mins

  return (
    <div className={`
      flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-colors
      ${isCritical
        ? 'bg-red-50 border-red-300 text-red-700 animate-pulse-soft'
        : isWarning
        ? 'bg-amber-50 border-amber-300 text-amber-700'
        : 'bg-white border-slate-200 text-slate-700'
      }
    `}>
      {isCritical
        ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        : <Clock className="w-4 h-4 flex-shrink-0" />
      }
      <span className="font-mono font-semibold tabular-nums text-sm">
        {String(hours).padStart(2, '0')}:
        {String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </span>
      {isWarning && (
        <span className="text-xs font-medium">
          {isCritical ? 'Time almost up!' : 'Running low'}
        </span>
      )}
    </div>
  )
}