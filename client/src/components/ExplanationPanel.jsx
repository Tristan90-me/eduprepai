import { X, Lightbulb, BookOpen, AlertTriangle, Star } from 'lucide-react'

// ── ExplanationPanel ───────────────────────────────────────────
// Slides in below the question card when student requests explanation.
// Shows structured AI breakdown of the question and answer.
export default function ExplanationPanel({ explanation, onClose }) {
  if (!explanation) return null

  const sections = [
    {
      icon:    BookOpen,
      colour:  'text-teal-600 bg-teal-50',
      label:   'What this question tests',
      content: explanation.conceptExplained,
    },
    {
      icon:    Star,
      colour:  'text-green-600 bg-green-50',
      label:   'Why the correct answer is right',
      content: explanation.whyCorrectIsRight,
    },
    explanation.whyStudentWasWrong && {
      icon:    X,
      colour:  'text-red-500 bg-red-50',
      label:   'Why your answer was wrong',
      content: explanation.whyStudentWasWrong,
    },
    {
      icon:    AlertTriangle,
      colour:  'text-amber-600 bg-amber-50',
      label:   'Common candidate mistakes',
      content: explanation.commonMistakes,
    },
    {
      icon:    Lightbulb,
      colour:  'text-purple-600 bg-purple-50',
      label:   'Study tip',
      content: explanation.studyTip,
    },
  ].filter(Boolean)

  return (
    <div className="max-w-3xl mx-auto mt-4 animate-fade-in">
      <div className="card border-2 border-teal-200 shadow-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p
                className="font-semibold text-slate-800 text-sm"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                AI Explanation
              </p>
              <p className="text-xs text-slate-400">Powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close explanation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation sections */}
        <div className="space-y-4">
          {sections.map(({ icon: Icon, colour, label, content }) => (
            content ? (
              <div key={label} className="flex gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colour}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
                </div>
              </div>
            ) : null
          ))}
        </div>

        {/* Key terms */}
        {explanation.keyTerms?.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Key terms to know
            </p>
            <div className="flex flex-wrap gap-1.5">
              {explanation.keyTerms.map(term => (
                <span key={term} className="badge-teal">{term}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}