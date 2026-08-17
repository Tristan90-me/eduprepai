import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// ── MathText ───────────────────────────────────────────────────
// Renders text that may contain LaTeX mathematical expressions.
//
// Supports both:
//   Inline:  $expression$  or \(expression\)
//   Display: $$expression$$ or \[expression\]
//
// Falls back to plain text if KaTeX parsing fails.
// Usage: <MathText text={question.questionText} />
export default function MathText({ text = '', className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !text) return

    try {
      // ── Replace display math: $$...$$ or \[...\] ──────────
      let processed = text
        .replace(/\$\$([^$]+)\$\$/g, (_, expr) => {
          try {
            return katex.renderToString(expr.trim(), {
              displayMode: true,
              throwOnError: false,
              strict:       false,
            })
          } catch { return _ }
        })
        // ── Replace inline math: $...$ ─────────────────────
        .replace(/\$([^$\n]+)\$/g, (_, expr) => {
          try {
            return katex.renderToString(expr.trim(), {
              displayMode: false,
              throwOnError: false,
              strict:       false,
            })
          } catch { return _ }
        })
        // ── Replace \(...\) ─────────────────────────────────
        .replace(/\\\(([^)]+)\\\)/g, (_, expr) => {
          try {
            return katex.renderToString(expr.trim(), {
              displayMode: false,
              throwOnError: false,
              strict:       false,
            })
          } catch { return _ }
        })
        // ── Replace \[...\] ─────────────────────────────────
        .replace(/\\\[([^\]]+)\\\]/g, (_, expr) => {
          try {
            return katex.renderToString(expr.trim(), {
              displayMode: true,
              throwOnError: false,
              strict:       false,
            })
          } catch { return _ }
        })

      ref.current.innerHTML = processed
    } catch {
      // If anything goes wrong, just show plain text
      if (ref.current) ref.current.textContent = text
    }
  }, [text])

  return (
    <span
      ref={ref}
      className={`math-text leading-relaxed ${className}`}
    />
  )
}