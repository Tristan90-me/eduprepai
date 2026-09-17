import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import QuestionDiagram from '../../components/QuestionDiagram'
import PartAnswerEditor from '../../components/PartAnswerEditor'
import MathText from '../../components/MathText'
import { assignmentAPI } from '../../api/assignment.api'
import { CheckCircle2, XCircle, ArrowLeft, Send, Camera, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

// ── AssignmentAnswerPage ─────────────────────────────────────────
// A flat list of every question in the assignment (unlike a mock exam,
// there are no sections) — MCQ options, PartAnswerEditor for
// Structured/Essay (one box per sub-part, same component the practice
// and mock-exam flows already use). Autosaves the same way
// MockExamPage does: MCQ immediately, typed answers debounced.
export default function AssignmentAnswerPage() {
  const { submissionId } = useParams()
  const navigate = useNavigate()

  const [loading,    setLoading]    = useState(true)
  const [assignment, setAssignment] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [answers,    setAnswers]    = useState({}) // { [index]: text }
  const [submitting, setSubmitting] = useState(false)
  // Bumped on every successful photo scan for a question — used as part
  // of PartAnswerEditor's `key` to force it to re-parse the transcribed
  // text, since that component only splits its `value` into per-part
  // boxes once, on mount (by design — see PartAnswerEditor.jsx).
  const [scanVersion, setScanVersion] = useState({}) // { [index]: number }
  const [scanningIdx, setScanningIdx] = useState(null)

  const autoSaveRef = useRef(null)

  useEffect(() => { load() }, [submissionId])

  const load = async () => {
    setLoading(true)
    try {
      const data = await assignmentAPI.getSubmission(submissionId)
      setAssignment(data.assignment)
      setSubmission(data.submission)
      setAnswers(Object.fromEntries(data.submission.answers.map((a, i) => [i, a.studentAnswer || ''])))
    } catch (err) {
      toast.error(err.message)
      navigate('/assignments')
    } finally {
      setLoading(false)
    }
  }

  const isReview = submission?.isReview

  const handleAnswerMCQ = useCallback(async (idx, letter) => {
    setAnswers(prev => ({ ...prev, [idx]: letter }))
    try {
      await assignmentAPI.saveAnswer(submissionId, idx, letter)
    } catch { /* silent — answer stored locally, retried on next change */ }
  }, [submissionId])

  const handleAnswerText = useCallback((idx, text) => {
    setAnswers(prev => ({ ...prev, [idx]: text }))
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(async () => {
      try {
        await assignmentAPI.saveAnswer(submissionId, idx, text)
      } catch { /* silent */ }
    }, 1500)
  }, [submissionId])

  // Scanning is deliberately not debounced/silent like typed answers —
  // it's a rarer, deliberate action, so the student should see a clear
  // success/failure result rather than a silent background retry.
  const handlePhotoUpload = async (idx, file, questionText) => {
    if (!file) return
    setScanningIdx(idx)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result.split(',')[1])
        reader.onerror = () => reject(new Error('Failed to read photo'))
        reader.readAsDataURL(file)
      })

      const data = await assignmentAPI.extractAnswerFromPhoto(base64, file.type, questionText)
      const text = data.transcribedAnswer || ''
      setAnswers(prev => ({ ...prev, [idx]: text }))
      setScanVersion(prev => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }))
      await assignmentAPI.saveAnswer(submissionId, idx, text, true)
      toast.success('Photo transcribed — review it below before submitting')
    } catch (err) {
      toast.error(err.message || 'Could not read that photo')
    } finally {
      setScanningIdx(null)
    }
  }

  const handleSubmit = async () => {
    if (!window.confirm('Submit this assignment? You cannot change your answers after submitting.')) return
    setSubmitting(true)
    try {
      const data = await assignmentAPI.submit(submissionId)
      toast.success(data.results ? 'Assignment submitted and marked!' : 'Assignment submitted!')
      load() // reload in review/pending-review mode
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="Assignment">
        <div className="max-w-3xl mx-auto text-center py-16 text-slate-400 text-sm">Loading…</div>
      </AppShell>
    )
  }
  if (!assignment) return null

  const answeredCount = Object.values(answers).filter(a => a?.trim()).length

  return (
    <AppShell title={assignment.title} subtitle={`${assignment.subject} · ${assignment.questions.length} questions`}>
      <div className="max-w-3xl mx-auto space-y-5">

        <button
          onClick={() => navigate('/assignments')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to assignments
        </button>

        {submission.status === 'marked' && (
          <div className="card bg-teal-50 border-teal-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-teal-900">Marked</p>
              <p className="text-sm text-teal-700">{submission.totalMarks}/{submission.availableMarks} marks ({submission.percent}%)</p>
            </div>
          </div>
        )}

        {submission.status === 'pending_review' && (
          <div className="card bg-amber-50 border-amber-200 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Awaiting your teacher's review</p>
              <p className="text-sm text-amber-700">
                You submitted a photographed answer — your teacher checks the AI's reading before results are shown.
              </p>
            </div>
          </div>
        )}

        {!isReview && (
          <div className="card bg-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-600">{answeredCount}/{assignment.questions.length} answered</p>
          </div>
        )}

        {assignment.questions.map((q, idx) => {
          const answer = answers[idx] || ''
          const marked = isReview ? submission.answers[idx] : null
          const showResult = isReview && marked?.marksAwarded !== null && marked?.marksAwarded !== undefined

          return (
            <div key={idx} className={`card shadow-sm border-2 ${
              showResult
                ? marked.isCorrect || (marked.marksAwarded / (q.marks || 1)) >= 0.5 ? 'border-green-200' : 'border-orange-200'
                : answer.trim() ? 'border-teal-200' : 'border-slate-100'
            }`}>
              {/* Question header */}
              <div className="flex items-start gap-3 mb-4">
                <span className="w-8 h-8 rounded-xl bg-teal-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-teal">{q.type}</span>
                    <span className="badge-gray">{q.marks} marks</span>
                    {q.topic && <span className="text-xs text-slate-400">{q.topic}</span>}
                  </div>
                  <QuestionDiagram hasImage={q.hasImage} imageData={q.imageData} />
                  <p className="text-slate-800 text-sm leading-relaxed font-medium">
                    <MathText text={q.questionText} />
                  </p>
                </div>
              </div>

              {/* Answer area */}
              <div className="ml-11">
                {q.type === 'MCQ' ? (
                  <div className="space-y-2">
                    {OPTION_LETTERS.map((letter, i) => {
                      const isSelected = answer === letter
                      const isCorrectOpt = isReview && q.correctOption === letter
                      const isWrongSelected = isReview && isSelected && !isCorrectOpt
                      return (
                        <button
                          key={letter}
                          type="button"
                          disabled={isReview}
                          onClick={() => handleAnswerMCQ(idx, letter)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm text-left transition-all ${
                            isCorrectOpt ? 'border-green-400 bg-green-50 text-green-800'
                            : isWrongSelected ? 'border-red-400 bg-red-50 text-red-700'
                            : isSelected ? 'border-teal-500 bg-teal-50 text-teal-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'border-current'}`}>
                            {letter}
                          </span>
                          <span className="flex-1"><MathText text={q.options?.[i] || ''} /></span>
                          {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                          {isWrongSelected && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <>
                    {!isReview && (
                      <label className={`inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 mb-2 cursor-pointer transition-colors ${scanningIdx === idx ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Camera className="w-3.5 h-3.5" />
                        {scanningIdx === idx ? 'Reading photo…' : 'Upload a photo of your answer instead'}
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={e => handlePhotoUpload(idx, e.target.files[0], q.questionText)}
                          disabled={scanningIdx === idx}
                        />
                      </label>
                    )}
                    <PartAnswerEditor
                      key={`q${idx}-v${scanVersion[idx] || 0}`}
                      parts={q.parts}
                      value={answer}
                      onChange={text => handleAnswerText(idx, text)}
                      disabled={isReview}
                      isReview={isReview}
                      partResults={marked?.partResults || []}
                      placeholder="Write your answer here, or upload a photo above..."
                    />
                  </>
                )}
              </div>

              {/* Review result — MCQ always shows its own; Structured/Essay
                 only when there are no sub-parts (PartAnswerEditor already
                 renders per-part marks/feedback inline when parts exist,
                 so this would otherwise duplicate that) */}
              {showResult && !(q.parts?.length > 0) && (
                <div className={`mt-4 ml-11 rounded-xl px-4 py-3 border ${
                  marked.isCorrect || (marked.marksAwarded / (q.marks || 1)) >= 0.5
                    ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {marked.isCorrect || (marked.marksAwarded / (q.marks || 1)) >= 0.5
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-orange-500" />
                    }
                    <span className="font-semibold text-sm">{marked.marksAwarded} / {q.marks} marks</span>
                  </div>
                  {marked.aiFeedback && <p className="text-xs text-slate-600">{marked.aiFeedback}</p>}
                </div>
              )}

              {isReview && q.modelAnswer && (
                <div className="mt-4 ml-11 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Model answer</p>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{q.modelAnswer}</p>
                </div>
              )}
            </div>
          )
        })}

        {!isReview && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full py-3.5 text-base"
          >
            {submitting
              ? <><span className="spinner border-white/40 border-t-white" /> Submitting…</>
              : <>Submit assignment <Send className="w-4 h-4" /></>
            }
          </button>
        )}
      </div>
    </AppShell>
  )
}
