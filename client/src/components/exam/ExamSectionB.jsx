import { CheckCircle2, XCircle } from 'lucide-react'

// ── ExamSectionB ───────────────────────────────────────────────
// Renders all 4 structured questions for Section B.
// Students type their answers in text areas.
export default function ExamSectionB({ questions, answers, onAnswer, isReview = false, markedQuestions }) {
  return (
    <div className="space-y-6">

      {/* Section header */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-blue-900 text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Section B — Structured Questions
            </h2>
            <p className="text-blue-700 text-sm mt-1">
              Answer ALL {questions.length} questions · 10 marks each · {questions.length * 10} marks total
            </p>
          </div>
          <span className="badge-blue text-sm px-3 py-1.5 flex-shrink-0">
            {Object.values(answers).filter(a => a?.trim()).length}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Individual questions */}
      {questions.map((q, idx) => {
        const answer = answers[idx] || ''
        const marked = markedQuestions?.[idx]
        const showResult = isReview && marked?.marksAwarded !== null

        return (
          <div key={idx} className={`card shadow-sm border-2 ${showResult
            ? marked.isCorrect ? 'border-green-200' : 'border-orange-200'
            : answer.trim() ? 'border-blue-200' : 'border-slate-100'
          }`}>

            {/* Question header */}
            <div className="flex items-start gap-3 mb-4">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge-blue">Structured</span>
                  <span className="badge-gray">10 marks</span>
                  <span className="text-xs text-slate-400">{q.topic}</span>
                </div>
                <p className="text-slate-800 text-sm leading-relaxed font-medium">
                  {q.questionText}
                </p>
              </div>
            </div>

            {/* Sub-parts */}
            {q.parts?.length > 0 && (
              <div className="ml-11 mb-4 space-y-2.5 bg-slate-50 rounded-xl p-4">
                {q.parts.map(part => (
                  <div key={part.part} className="flex gap-2.5 text-sm text-slate-700">
                    <span className="font-bold text-blue-600 flex-shrink-0 w-5">({part.part})</span>
                    <span className="flex-1">{part.text}</span>
                    <span className="text-slate-400 flex-shrink-0 font-medium">[{part.marks} marks]</span>
                  </div>
                ))}
              </div>
            )}

            {/* Answer area */}
            <div className="ml-11">
              <label className="label">
                Your answer
                <span className="text-slate-400 font-normal ml-1">
                  — address each part (a), (b), (c) separately
                </span>
              </label>
              <textarea
                value={answer}
                onChange={e => !isReview && onAnswer(idx, e.target.value)}
                disabled={isReview}
                placeholder="Write your answer here. Label each part clearly: (a) ..., (b) ..., (c) ..."
                rows={7}
                className="input resize-none disabled:bg-slate-50 disabled:text-slate-600"
              />
              {!isReview && (
                <p className="text-xs text-slate-400 mt-1.5 text-right">
                  {answer.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              )}
            </div>

            {/* Review result */}
            {showResult && (
              <div className={`mt-4 ml-11 rounded-xl px-4 py-3 border ${
                (marked.marksAwarded / 10) >= 0.5
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {(marked.marksAwarded / 10) >= 0.5
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-orange-500" />
                  }
                  <span className="font-semibold text-sm">
                    {marked.marksAwarded} / 10 marks
                  </span>
                </div>
                {marked.aiFeedback && (
                  <p className="text-xs text-slate-600 mb-2">{marked.aiFeedback}</p>
                )}
                {marked.partResults?.length > 0 && (
                  <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-200">
                    {marked.partResults.map((pr, pi) => (
                      <div key={pi} className="flex gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-blue-600 flex-shrink-0">
                          ({pr.part})
                        </span>
                        <span className="text-slate-500">{pr.marksAwarded}/{pr.marksAvailable}m —</span>
                        <span className="flex-1">{pr.feedback}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}