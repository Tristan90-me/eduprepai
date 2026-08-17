import { CheckCircle2, Circle } from 'lucide-react'
import MathText from '../MathText'
const LETTERS = ['A', 'B', 'C', 'D']

// ── ExamSectionA ───────────────────────────────────────────────
// Renders all 40 MCQ questions for Section A.
// Student can navigate freely between questions.
// Answers are auto-saved on each selection.
export default function ExamSectionA({ questions, answers, onAnswer, isReview = false, markedQuestions }) {
  return (
    <div className="space-y-6">

      {/* Section header */}
      <div className="card bg-teal-50 border-teal-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-teal-900 text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Section A — Multiple Choice
            </h2>
            <p className="text-teal-700 text-sm mt-1">
              Answer ALL {questions.length} questions · 1 mark each · {questions.length} marks total
            </p>
          </div>
          <span className="badge-teal text-sm px-3 py-1.5 flex-shrink-0">
            {Object.values(answers).filter(a => a).length}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Questions grid — 2 columns on desktop for density */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((q, idx) => {
          const answered     = answers[idx] || ''
          const marked       = markedQuestions?.[idx]
          const showResult   = isReview && marked

          return (
            <div
              key={idx}
              className={`card transition-all ${
                showResult
                  ? marked.isCorrect
                    ? 'border-2 border-green-300 bg-green-50/30'
                    : 'border-2 border-red-300 bg-red-50/30'
                  : answered
                  ? 'border-2 border-teal-200 bg-teal-50/20'
                  : 'border-2 border-slate-100'
              }`}
            >
              {/* Question number + text */}
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-800 leading-relaxed flex-1">
                  <MathText text={q.questionText} />
                </p>
              </div>

              {/* MCQ options */}
              <div className="space-y-1.5 ml-8">
                {LETTERS.map((letter, i) => {
                  const isSelected = answered === letter
                  const isCorrect  = showResult && letter === marked?.correctOption
                  const isWrong    = showResult && isSelected && !marked?.isCorrect

                  return (
                    <button
                      key={letter}
                      disabled={isReview}
                      onClick={() => !isReview && onAnswer(idx, letter)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded-lg
                        text-xs text-left transition-all duration-150
                        ${isReview ? 'cursor-default' : 'cursor-pointer'}
                        ${isCorrect  ? 'bg-green-100 border border-green-300 text-green-800 font-medium' :
                          isWrong    ? 'bg-red-100 border border-red-300 text-red-700' :
                          isSelected ? 'bg-teal-100 border border-teal-400 text-teal-800 font-medium' :
                                       'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'}
                      `}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : isSelected ? (
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${isWrong ? 'border-red-500 bg-red-500' : 'border-teal-500 bg-teal-500'}`} />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-slate-500 w-3 flex-shrink-0">{letter}.</span>
                      <span className="flex-1">
                        <MathText text={q.options?.[i] || ''} />
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Review feedback */}
              {showResult && marked?.aiFeedback && (
                <p className="text-xs text-slate-500 mt-2 ml-8 italic">
                  {marked.aiFeedback}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}