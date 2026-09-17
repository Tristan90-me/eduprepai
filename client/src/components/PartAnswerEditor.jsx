import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

// ── Label helpers ──────────────────────────────────────────────
// A part's stored label is a dotted string like "a.i" for a leaf
// sub-part, or a bare "a" when it has no further sub-division.
// Displayed as "(a)(i)" / "(a)" respectively, matching how WAEC
// papers themselves number sub-parts.
const labelToMarker = (label) => label.split('.').map(s => `(${s})`).join('')

// ── Parse a combined answer string back into per-part text ──────
// Only needs to handle strings THIS component itself produced
// (formatCombinedAnswer, below) — used to resume editing an
// in-progress answer, and to show a per-part breakdown in review
// mode. Best-effort: if the stored answer predates this format (a
// single free-text blob), nothing matches and it's treated as
// unparsed — see the `unparsed` fallback in the component itself.
const parseCombinedAnswer = (combined, parts) => {
  if (!combined || parts.length === 0) return {}

  const found = parts
    .map(p => ({ part: p.part, marker: labelToMarker(p.part), idx: combined.indexOf(labelToMarker(p.part)) }))
    .filter(f => f.idx !== -1)
    .sort((a, b) => a.idx - b.idx)

  if (found.length === 0) return {}

  const result = {}
  found.forEach((f, i) => {
    const start = f.idx + f.marker.length
    const end = i + 1 < found.length ? found[i + 1].idx : combined.length
    result[f.part] = combined.slice(start, end).trim()
  })
  return result
}

const formatCombinedAnswer = (parts, answers) =>
  parts.map(p => `${labelToMarker(p.part)} ${(answers[p.part] || '').trim()}`).join('\n\n')

// ── PartAnswerEditor ─────────────────────────────────────────────
// Drop-in replacement for a single big textarea on a Structured/Essay
// question. When `parts` has entries, renders one answer box per part
// (or per leaf sub-part, e.g. "(a)(i)"), and keeps parents on exactly
// the single-combined-string contract they already had — `onChange`
// always receives one string, auto-save/submit/marking need no changes.
// Falls back to a single plain textarea when there are no parts.
export default function PartAnswerEditor({
  parts = [],
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Write your answer here...',
  isReview = false,
  partResults = [],
}) {
  const hasParts = parts.length > 0
  // Parsed once, on mount — every place this renders (QuestionCard is
  // remounted per question via `key`; ExamSectionB/C mount once per
  // question for the whole session, same as the textarea they replace)
  // already guarantees a fresh instance whenever `value`'s starting
  // point could differ, so there's no need to react to prop changes
  // after that — doing so would fight with the student's own typing.
  const [answers, setAnswers] = useState(() => parseCombinedAnswer(value, parts))

  if (!hasParts) {
    if (isReview) {
      return (
        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 rounded-xl p-4">
          {value || 'No answer provided.'}
        </p>
      )
    }
    return (
      <div>
        <label className="label">Your answer</label>
        <textarea
          value={value}
          onChange={e => !disabled && onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={10}
          className="input resize-none disabled:bg-slate-50 disabled:text-slate-600"
        />
      </div>
    )
  }

  const handlePartChange = (partId, text) => {
    const next = { ...answers, [partId]: text }
    setAnswers(next)
    onChange(formatCombinedAnswer(parts, next))
  }

  // Unparsed legacy answer — an older combined string that doesn't
  // match this component's own markers. Show it once, read-only, so
  // nothing the student already wrote is silently hidden.
  const unparsed = value && Object.keys(answers).length === 0 ? value : null

  return (
    <div className="space-y-4">
      {unparsed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Previously saved answer</p>
          <p className="text-sm text-slate-700 whitespace-pre-line">{unparsed}</p>
        </div>
      )}

      {parts.map(part => {
        const marker = labelToMarker(part.part)
        const result = partResults.find(pr => pr.part === part.part)
        const showResult = isReview && result?.marksAwarded !== undefined

        return (
          <div key={part.part} className={`rounded-xl border p-3 ${
            showResult
              ? result.marksAwarded >= (result.marksAvailable || part.marks || 1) / 2
                ? 'border-green-200 bg-green-50/30'
                : 'border-orange-200 bg-orange-50/30'
              : 'border-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-teal-600">{marker}</span>{' '}
                {part.text}
              </p>
              <span className="text-xs text-slate-400 flex-shrink-0">{part.marks} marks</span>
            </div>

            {isReview ? (
              <p className="text-sm text-slate-700 whitespace-pre-line bg-white rounded-lg p-2.5 border border-slate-100">
                {answers[part.part] || 'Not answered.'}
              </p>
            ) : (
              <textarea
                value={answers[part.part] || ''}
                onChange={e => handlePartChange(part.part, e.target.value)}
                disabled={disabled}
                placeholder={`Answer for ${marker}...`}
                rows={3}
                className="input resize-none disabled:bg-slate-50 disabled:text-slate-600"
              />
            )}

            {showResult && (
              <div className="flex items-start gap-2 mt-2 pt-2 border-t border-slate-200">
                {result.marksAwarded >= (result.marksAvailable || part.marks || 1) / 2
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                }
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">
                    {result.marksAwarded}/{result.marksAvailable || part.marks} marks
                  </p>
                  {result.feedback && (
                    <p className="text-xs text-slate-500 mt-0.5">{result.feedback}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
