import { CheckCircle2, XCircle } from 'lucide-react'

// ── ExamSectionC ───────────────────────────────────────────────
// Renders 2 essay questions for Section C.
// Student answers ONE question only.
// Selecting a question deselects the other.
export default function ExamSectionC({
  questions,
  selectedQuestion,  // index: 0 or 1
  answer,
  onSelectQuestion,
  onAnswer,
  isReview = false,
  markedQuestions,
}) {
  const chosenIdx   = selectedQuestion ?? null
  const chosenQ     = chosenIdx !== null ? questions[chosenIdx] : null
  const marked      = isReview && chosenIdx !== null ? markedQuestions?.[chosenIdx] : null
  const showResult  = isReview && marked?.marksAwarded !== null

  return (
    <div className="space-y-6">

      {/* Section header */}
      <div className="card bg-purple-50 border-purple-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-purple-900 text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Section C — Essay Question
            </h2>
            <p className="text-purple-700 text-sm mt-1">
              Answer ONE question only · 20 marks
            </p>
          </div>
          {chosenIdx !== null && (
            <span className="badge-purple text-sm px-3 py-1.5 flex-shrink-0">
              Question {chosenIdx + 1} selected
            </span>
          )}
        </div>
      </div>

      {/* Question selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((q, idx) => (
          <button
            key={idx}
            disabled={isReview}
            onClick={() => !isReview && onSelectQuestion(idx)}
            className={`card text-left transition-all duration-200 border-2 ${
              chosenIdx === idx
                ? 'border-purple-400 bg-purple-50/40 shadow-md'
                : 'border-slate-200 hover:border-purple-300'
            } ${isReview ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                chosenIdx === idx
                  ? 'border-purple-500 bg-purple-500'
                  : 'border-slate-300'
              }`}>
                {chosenIdx === idx && <span className="text-white text-xs">✓</span>}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="badge-purple">Question {idx + 1}</span>
                  <span className="badge-gray">20 marks</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{q.questionText}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Answer area — only shown after question is selected */}
      {chosenQ && (
        <div className="card border-2 border-purple-200 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-xl bg-purple-600 text-white text-sm font-bold flex items-center justify-center">
              {chosenIdx + 1}
            </span>
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                Answering Question {chosenIdx + 1}
              </p>
              <p className="text-xs text-slate-500">Aim for 3–5 well-developed paragraphs</p>
            </div>
          </div>

          <div>
            <label className="label">Your essay</label>
            <textarea
              value={answer}
              onChange={e => !isReview && onAnswer(e.target.value)}
              disabled={isReview}
              placeholder="Write your essay here. Include:&#10;• Introduction — state your position&#10;• Main body — 3-4 paragraphs with evidence&#10;• Conclusion — summarise your argument"
              rows={14}
              className="input resize-none disabled:bg-slate-50 disabled:text-slate-600"
            />
            {!isReview && (
              <p className="text-xs text-slate-400 mt-1.5 flex justify-between">
                <span>Use clear paragraphs and WAEC-standard language</span>
                <span className="tabular-nums">
                  {answer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </p>
            )}
          </div>

          {/* Review result */}
          {showResult && (
            <div className={`mt-4 rounded-xl px-4 py-4 border ${
              marked.marksAwarded >= 10
                ? 'bg-green-50 border-green-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {marked.marksAwarded >= 10
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <XCircle className="w-4 h-4 text-orange-500" />
                }
                <span className="font-semibold text-sm">
                  {marked.marksAwarded} / 20 marks
                </span>
                {marked.passFailIndicator && (
                  <span className={`badge-${marked.marksAwarded >= 10 ? 'green' : 'red'} ml-1`}>
                    {marked.passFailIndicator}
                  </span>
                )}
              </div>
              {marked.aiFeedback && (
                <p className="text-sm text-slate-700 leading-relaxed mb-3">
                  {marked.aiFeedback}
                </p>
              )}
              {marked.partResults?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Criteria breakdown
                  </p>
                  {marked.partResults.map((cr, ci) => (
                    <div key={ci} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-purple-600 flex-shrink-0 w-36 truncate">
                        {cr.name || cr.part}
                      </span>
                      <span className="text-slate-500 flex-shrink-0">
                        {cr.marksAwarded}/{cr.marksAvailable}m
                      </span>
                      <span className="flex-1 text-slate-500">— {cr.feedback}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}