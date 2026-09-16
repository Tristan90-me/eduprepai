import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../../api/admin.api'
import QuestionPreviewTable from './QuestionPreviewTable'
import { ClipboardCheck, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubjectsForExamType, GHANAIAN_LANGUAGES } from '../../constants/subjects'

// ── ReviewQueuePanel ─────────────────────────────────────────────
// Questions inserted by the batch PDF extractor (server/scripts/
// batchExtractPdfs.js) land here — isActive: false, pendingReview:
// true — and stay invisible to students until approved on this page.
export default function ReviewQueuePanel() {
  const [examType, setExamType] = useState('BECE')
  const [subject,  setSubject]  = useState('') // '' = all subjects
  const [previews, setPreviews] = useState(null)
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminAPI.getReviewQueue({
        examType,
        subject: subject || undefined,
        limit: 50,
      })
      setPreviews(data.questions)
      setTotal(data.total)
    } catch (err) {
      toast.error(err.message)
      setPreviews([])
    } finally {
      setLoading(false)
    }
  }, [examType, subject])

  useEffect(() => { load() }, [load])

  const handleApprove = async (approved) => {
    try {
      const data = await adminAPI.approveReviewQueue(approved)
      toast.success(data.message)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleReject = async (previewId) => {
    try {
      await adminAPI.rejectReviewQueueItem(previewId)
      setTotal(t => Math.max(0, t - 1))
    } catch (err) {
      toast.error('Could not reject question: ' + err.message)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
              Review Queue
            </h3>
            <p className="text-sm text-slate-500">
              {total} question{total !== 1 ? 's' : ''} awaiting approval — hidden from students until saved here
            </p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary text-sm">
          {loading ? <span className="spinner" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Exam type</label>
            <select
              value={examType}
              onChange={e => { setExamType(e.target.value); setSubject('') }}
              className="input"
            >
              <option>BECE</option>
              <option>WASSCE</option>
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="input">
              <option value="">All subjects</option>
              {getSubjectsForExamType(examType)
                .filter(s => !GHANAIAN_LANGUAGES.includes(s))
                .map(s => <option key={s}>{s}</option>)}
              {examType === 'BECE' && GHANAIAN_LANGUAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Queue */}
      {loading && !previews && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
          <span className="spinner text-teal-500" /> Loading review queue…
        </div>
      )}

      {previews && previews.length === 0 && (
        <div className="card text-center py-12">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nothing waiting for review right now.</p>
        </div>
      )}

      {previews && previews.length > 0 && (
        <QuestionPreviewTable
          previews={previews}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={load}
        />
      )}
    </div>
  )
}
