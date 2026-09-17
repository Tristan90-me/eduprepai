import { useState, useEffect } from 'react'
import { teacherAPI } from '../../api/teacher.api'
import MathText from '../MathText'
import { Camera, ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'

// ── SubmissionReviewPanel ────────────────────────────────────────
// Shown when a teacher opens one pending-review submission (reached
// only when the student scanned at least one answer as a photo — see
// AssignmentSubmission's status flow). Every question's AI-suggested
// mark/feedback is pre-filled and editable; a teacher happy with the
// AI's read can just scroll down and click Publish without touching
// anything — only misread scans need an adjustment.
export default function SubmissionReviewPanel({ submissionId, onBack, onPublished }) {
  const [loading,   setLoading]   = useState(true)
  const [data,      setData]      = useState(null)
  const [overrides, setOverrides] = useState([]) // [{ marksAwarded, aiFeedback }]
  const [publishing, setPublishing] = useState(false)

  useEffect(() => { load() }, [submissionId])

  const load = async () => {
    setLoading(true)
    try {
      const result = await teacherAPI.getSubmissionForReview(submissionId)
      setData(result)
      setOverrides(result.submission.answers.map(a => ({
        marksAwarded: a.marksAwarded ?? 0,
        aiFeedback:   a.aiFeedback || '',
      })))
    } catch (err) {
      toast.error(err.message)
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const updateOverride = (idx, field, value) => {
    setOverrides(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o))
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const payload = overrides.map(o => ({ marksAwarded: Number(o.marksAwarded) || 0, aiFeedback: o.aiFeedback }))
      const result = await teacherAPI.publishSubmission(submissionId, payload)
      toast.success(`Published — ${result.results.totalMarks}/${result.results.availableMarks} (${result.results.percent}%)`)
      onPublished()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
  if (!data) return null

  const { submission, assignment } = data
  const totalMarks = overrides.reduce((sum, o) => sum + (Number(o.marksAwarded) || 0), 0)
  const availableMarks = assignment.questions.reduce((sum, q) => sum + (q.marks || 0), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to review queue
      </button>

      <div className="card bg-amber-50 border-amber-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-semibold text-amber-900">{assignment.title}</p>
          <p className="text-sm text-amber-700">{submission.studentName} · {assignment.subject}</p>
        </div>
        <span className="badge-amber text-sm">{totalMarks}/{availableMarks} marks (AI-suggested, editable below)</span>
      </div>

      {assignment.questions.map((q, idx) => {
        const answer = submission.answers[idx]
        return (
          <div key={idx} className="card">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-800 flex-1">
                <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                <MathText text={q.questionText} />
              </p>
              <span className="badge-gray text-xs flex-shrink-0">{q.marks} marks</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-3">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student's answer</p>
                {answer?.wasScanned && (
                  <span className="flex items-center gap-1 text-xs text-blue-600">
                    <Camera className="w-3 h-3" /> scanned
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line">{answer?.studentAnswer || 'Not answered.'}</p>
            </div>

            {q.modelAnswer && (
              <div className="bg-teal-50 rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">Model answer</p>
                <p className="text-sm text-teal-800 whitespace-pre-line">{q.modelAnswer}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-3">
              <div>
                <label className="label">Marks</label>
                <input
                  type="number" min={0} max={q.marks}
                  value={overrides[idx]?.marksAwarded ?? 0}
                  onChange={e => updateOverride(idx, 'marksAwarded', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Feedback</label>
                <textarea
                  value={overrides[idx]?.aiFeedback ?? ''}
                  onChange={e => updateOverride(idx, 'aiFeedback', e.target.value)}
                  rows={2}
                  className="input resize-none"
                />
              </div>
            </div>
          </div>
        )
      })}

      <button
        onClick={handlePublish}
        disabled={publishing}
        className="btn-primary w-full py-3.5 text-base"
      >
        {publishing
          ? <><span className="spinner border-white/40 border-t-white" /> Publishing…</>
          : <>Publish results to student <Send className="w-4 h-4" /></>
        }
      </button>
    </div>
  )
}
