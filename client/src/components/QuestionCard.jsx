import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, BookOpen, ChevronRight } from 'lucide-react'
import MasteryBadge from './MasteryBadge'
import MathText from './MathText'

// ── Option button colours ──────────────────────────────────────
const OPTION_LETTERS = ['A', 'B', 'C', 'D']

const getOptionStyle = (letter, selected, result) => {
  // Before answering
  if (!result) {
    return selected === letter
      ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-200'
      : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/50'
  }
  // After answering — reveal correct/incorrect
  if (letter === result.correctAnswer) {
    return 'border-green-400 bg-green-50 text-green-800 ring-2 ring-green-200'
  }
  if (letter === selected && !result.isCorrect) {
    return 'border-red-400 bg-red-50 text-red-700'
  }
  return 'border-slate-100 bg-slate-50 text-slate-400'
}

// ── QuestionCard ───────────────────────────────────────────────
export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onSubmit,          // (answer) => void
  result,            // null until answered
  onExplain,         // () => void
  isExplaining,      // true while AI is generating explanation
  timerSeconds,      // optional countdown timer
}) {
  const [selected,     setSelected]     = useState('')
  const [typedAnswer,  setTypedAnswer]  = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const isMCQ       = question.type === 'MCQ'
  const isAnswered  = !!result

  const handleSubmit = () => {
    if (hasSubmitted) return
    const answer = isMCQ ? selected : typedAnswer
    if (!answer.trim()) return
    setHasSubmitted(true)
    onSubmit(answer)
  }

  return (
    <div className="card shadow-md max-w-3xl mx-auto animate-fade-in">

      {/* ── Card header ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {questionNumber} / {totalQuestions}
          </span>
          <span className="badge-teal">{question.type}</span>
          <span className="badge-gray">Difficulty {question.difficulty}/5</span>
          {question.marks > 1 && (
            <span className="badge-amber">{question.marks} marks</span>
          )}
        </div>

        {/* Timer */}
        {timerSeconds !== undefined && !isAnswered && (
          <div className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums ${timerSeconds <= 10 ? 'text-red-500 animate-pulse-soft' : 'text-slate-500'}`}>
            <Clock className="w-4 h-4" />
            {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:
            {(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* ── Topic chip + mastery ───────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
        <span className="text-xs font-medium text-teal-700">{question.topic}</span>
        {question.topicMastery && (
          <MasteryBadge score={question.topicMastery.score} size="sm" />
        )}
      </div>

      {/* ── Question text ──────────────────────────────────── */}
      <p className="text-slate-800 text-base leading-relaxed mb-6">
        <MathText text={question.questionText} />
      </p>

      {/* ── Structured question parts ──────────────────────── */}
      {question.parts?.length > 0 && (
        <div className="mb-5 space-y-2 bg-slate-50 rounded-xl p-4">
          {question.parts.map(part => (
            <div key={part.part} className="flex gap-2 text-sm text-slate-700">
              <span className="font-semibold text-teal-600 flex-shrink-0">({part.part})</span>
              <span>{part.text}</span>
              <span className="text-slate-400 ml-auto flex-shrink-0">[{part.marks} marks]</span>
            </div>
          ))}
        </div>
      )}

      {/* ── MCQ options ────────────────────────────────────── */}
      {isMCQ && (
        <div className="space-y-2.5 mb-6">
          {OPTION_LETTERS.map((letter, i) => (
            <button
              key={letter}
              disabled={isAnswered}
              onClick={() => !isAnswered && setSelected(letter)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                border-2 text-sm text-left transition-all duration-200
                cursor-pointer disabled:cursor-default
                ${getOptionStyle(letter, selected, result)}
              `}
            >
              {/* Result icon */}
              {result && letter === result.correctAnswer && (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              {result && letter === selected && !result.isCorrect && letter !== result.correctAnswer && (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              {(!result || (letter !== result.correctAnswer && !(letter === selected && !result.isCorrect))) && (
                <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${selected === letter && !result ? 'bg-teal-500 border-teal-500 text-white' : 'border-current'}`}>
                  {letter}
                </span>
              )}
              <span className="flex-1">
              <MathText text={question.options?.[i] || ''} />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Typed answer (Structured + Essay) ─────────────── */}
      {!isMCQ && (
        <div className="mb-6">
          <label className="label">
            Your answer
            {question.type === 'Essay' && (
              <span className="text-slate-400 font-normal ml-1">
                (aim for at least 3 paragraphs)
              </span>
            )}
          </label>
          <textarea
            value={typedAnswer}
            onChange={e => !isAnswered && setTypedAnswer(e.target.value)}
            disabled={isAnswered}
            placeholder={
              question.type === 'Structured'
                ? 'Type your answer here. Address each part (a), (b), (c) clearly...'
                : 'Write your essay here. Include an introduction, main body, and conclusion...'
            }
            rows={question.type === 'Essay' ? 10 : 5}
            className="input resize-none disabled:bg-slate-50 disabled:text-slate-600"
          />
          {!isAnswered && typedAnswer.length > 0 && (
            <p className="text-xs text-slate-400 mt-1.5 text-right">
              {typedAnswer.trim().split(/\s+/).length} words
            </p>
          )}
        </div>
      )}

      {/* ── Result banner ──────────────────────────────────── */}
      {result && (
        <div className={`
          rounded-xl px-4 py-3.5 mb-5 flex items-start gap-3 animate-fade-in
          ${result.isCorrect
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
          }
        `}>
          {result.isCorrect
            ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          }
          <div className="flex-1">
            <p className={`text-sm font-semibold ${result.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {result.isCorrect ? 'Correct!' : 'Incorrect'}
              {' '}
              <span className="font-normal">
                {result.marksAwarded}/{result.marksAvailable} marks
              </span>
            </p>
            {!result.isCorrect && result.correctAnswer && (
              <p className="text-xs text-red-700 mt-0.5">
                Correct answer: <strong>{result.correctAnswer}</strong>
              </p>
            )}
            {result.overallFeedback && (
              <p className="text-xs text-slate-600 mt-1.5">{result.overallFeedback}</p>
            )}
            {/* Per-part results for structured/essay */}
            {result.partResults?.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {result.partResults.map((part, i) => (
                  <div key={i} className="text-xs text-slate-600 flex gap-2">
                    <span className="font-semibold text-teal-600 flex-shrink-0">
                      ({part.part || part.name})
                    </span>
                    <span>{part.marksAwarded}/{part.marksAvailable}m —</span>
                    <span className="flex-1">{part.feedback}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mastery update badge */}
          {result.masteryUpdate && (
            <div className="text-right flex-shrink-0">
              <p className={`text-xs font-semibold ${result.masteryUpdate.newScore > result.masteryUpdate.oldScore ? 'text-green-600' : 'text-red-600'}`}>
                {result.masteryUpdate.newScore > result.masteryUpdate.oldScore ? '+' : ''}
                {result.masteryUpdate.newScore - result.masteryUpdate.oldScore}
              </p>
              <p className="text-xs text-slate-400">mastery</p>
            </div>
          )}
        </div>
      )}

      {/* ── Action buttons ─────────────────────────────────── */}
      <div className="flex gap-3">
        {!isAnswered ? (
          <button
            onClick={handleSubmit}
            disabled={isMCQ ? !selected : !typedAnswer.trim()}
            className="btn-primary flex-1 py-3"
          >
            Submit answer <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={onExplain}
              disabled={isExplaining}
              className="btn-secondary flex-1 py-2.5"
            >
              {isExplaining
                ? <><span className="spinner" /> Getting explanation…</>
                : '💡 Explain this'
              }
            </button>
            <button
              onClick={() => onSubmit('__next__')}
              className="btn-primary flex-1 py-2.5"
            >
              Next question <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}