import { CheckCircle2, XCircle } from 'lucide-react'
import QuestionDiagram from '../QuestionDiagram'
import PartAnswerEditor from '../PartAnswerEditor'

// ── ExamSectionC ───────────────────────────────────────────────
// Renders the offered Section C questions. Student answers up to
// `answerCount` of them (1 for the generic WAEC structure — the
// original "choose one of two" behaviour, unchanged; more for
// subjects with their own real structure, e.g. BECE Computing offers
// 4 and expects 3 answered, or BECE Mathematics offers 6/answers 4).
//
// `sectionLabel` lets a subject with no real Section C at all (e.g.
// BECE Mathematics, whose 6-offered/4-answered theory questions are
// WAEC's actual "Section B") display as "Section B" instead — this
// component's internal data bucket is still called "C" everywhere
// else in the app (routing/state keys unchanged), only the label
// shown to the student changes.
export default function ExamSectionC({
  questions,
  answerCount = 1,
  selectedIndices,   // array of selected question indices
  answers,           // { [index]: answerText }
  onToggleQuestion,  // (idx) => void — parent just toggles membership
  onAnswerChange,    // (idx, text) => void
  isReview = false,
  markedQuestions,
  onExplain,         // (idx) => void
  explaining = false,
  sectionLabel = 'C',
}) {
  const marksEach = questions[0]?.marks || 20
  const atCap = selectedIndices.length >= answerCount
  // Real Structured-type theory questions (e.g. Mathematics) read and
  // behave differently from a free-form Essay — different header
  // wording, placeholder, and "aim for paragraphs" guidance would be
  // actively misleading for a multi-part structured answer.
  const isStructured = questions[0]?.type === 'Structured'
  const questionWord = isStructured ? 'Structured Question' : 'Essay Question'

  return (
    <div className="space-y-6">

      {/* Section header */}
      <div className="card bg-purple-50 border-purple-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-purple-900 text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Section {sectionLabel} — {questionWord}{questions.length > 1 ? 's' : ''}
            </h2>
            <p className="text-purple-700 text-sm mt-1">
              Answer any {answerCount} of the following {questions.length} question{questions.length > 1 ? 's' : ''} · {marksEach} marks each
            </p>
          </div>
          <span className="badge-purple text-sm px-3 py-1.5 flex-shrink-0">
            {selectedIndices.length}/{answerCount} selected
          </span>
        </div>
      </div>

      {/* Question selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((q, idx) => {
          const isSelected = selectedIndices.includes(idx)
          const disabled = isReview || (!isSelected && atCap)

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => !isReview && !disabled && onToggleQuestion(idx)}
              className={`card text-left transition-all duration-200 border-2 ${
                isSelected
                  ? 'border-purple-400 bg-purple-50/40 shadow-md'
                  : disabled
                  ? 'border-slate-100 opacity-50'
                  : 'border-slate-200 hover:border-purple-300'
              } ${isReview || disabled ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-slate-300'
                }`}>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="badge-purple">Question {idx + 1}</span>
                    <span className="badge-gray">{q.marks || marksEach} marks</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{q.questionText}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Answer area — one per selected question */}
      {selectedIndices.map(idx => {
        const q = questions[idx]
        const answer = answers[idx] || ''
        const marked = isReview ? markedQuestions?.[idx] : null
        const showResult = isReview && marked?.marksAwarded !== null
        const passMark = (q.marks || marksEach) / 2

        return (
          <div key={idx} className="card border-2 border-purple-200 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white text-sm font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  Answering Question {idx + 1}
                </p>
                <p className="text-xs text-slate-500">
                  {isStructured ? 'Answer each part clearly, showing your working' : 'Aim for 3–5 well-developed paragraphs'}
                </p>
              </div>
            </div>

            <QuestionDiagram hasImage={q.hasImage} imageData={q.imageData} />

            <div>
              {!q.parts?.length && <label className="label">{isStructured ? 'Your answer' : 'Your essay'}</label>}
              <PartAnswerEditor
                parts={q.parts}
                value={answer}
                onChange={text => onAnswerChange(idx, text)}
                disabled={isReview}
                isReview={isReview}
                partResults={marked?.partResults || []}
                placeholder={isStructured
                  ? 'Write your answer here. Show your working for each part.'
                  : 'Write your essay here. Include:&#10;• Introduction — state your position&#10;• Main body — 3-4 paragraphs with evidence&#10;• Conclusion — summarise your argument'
                }
              />
              {!isReview && (
                <p className="text-xs text-slate-400 mt-1.5 flex justify-between">
                  <span>{isStructured ? 'Show all working clearly' : 'Use clear paragraphs and WAEC-standard language'}</span>
                  <span className="tabular-nums">
                    {answer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </p>
              )}
            </div>

            {/* Review result */}
            {showResult && (
              <div className={`mt-4 rounded-xl px-4 py-4 border ${
                marked.marksAwarded >= passMark
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {marked.marksAwarded >= passMark
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-orange-500" />
                  }
                  <span className="font-semibold text-sm">
                    {marked.marksAwarded} / {q.marks || marksEach} marks
                  </span>
                  {marked.passFailIndicator && (
                    <span className={`badge-${marked.marksAwarded >= passMark ? 'green' : 'red'} ml-1`}>
                      {marked.passFailIndicator}
                    </span>
                  )}
                </div>
                {marked.aiFeedback && (
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">
                    {marked.aiFeedback}
                  </p>
                )}
                {marked.partResults?.length > 0 && !(q.parts?.length > 0) && (
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
                {onExplain && (
                  <button
                    onClick={() => onExplain(idx)}
                    disabled={explaining}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-3 pt-2 border-t border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Explain this question
                  </button>
                )}
              </div>
            )}

            {/* Marking scheme — the guide used to mark this answer */}
            {isReview && q.modelAnswer && (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Marking scheme
                </p>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {q.modelAnswer}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
