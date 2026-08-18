import { useEffect, useRef, useState } from 'react'

// ── useCountUp ────────────────────────────────────────────────
// Animates a number from its previous value up (or down) to
// `target` over `duration` ms. Skips straight to the target when
// the user prefers reduced motion — a JS rAF loop isn't covered
// by the CSS-only prefers-reduced-motion rule in index.css.
export default function useCountUp(target, { duration = 800 } = {}) {
  const [value, setValue] = useState(target)
  const fromRef  = useRef(target)
  const frameRef = useRef(null)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setValue(target)
      fromRef.current = target
      return
    }

    const from  = fromRef.current
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      // Ease-out — fast start, gentle settle
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (target - from) * eased))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}
