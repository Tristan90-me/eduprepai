import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import MockExamReview from '../../components/exam/MockExamReview'
import { mockExamAPI } from '../../api/mockExam.api'
import { ArrowLeft, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

// ── MockExamReviewPage ───────────────────────────────────────────
// Loads any past marked exam by ID and shows the same full review
// (results + section-by-section walkthrough + Explain) students see
// right after submitting — reachable from "Previous attempts" and
// the Analytics "Mock Exams" tab.
export default function MockExamReviewPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [exam,    setExam]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await mockExamAPI.getExam(id)
        if (data.exam.status !== 'marked') {
          toast.error('This exam has not been marked yet')
          return navigate('/mock-exam')
        }
        setExam(data.exam)
      } catch (err) {
        toast.error(err.message)
        navigate('/mock-exam')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <AppShell title="Exam Review" subtitle="Loading…">
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppShell>
  )

  if (!exam) return null

  return (
    <AppShell
      title="Exam Review"
      subtitle={`${exam.subject} · ${exam.examType} · ${new Date(exam.submittedAt || exam.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
    >
      <div className="max-w-5xl mx-auto space-y-5">

        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate('/mock-exam')} className="btn-secondary text-sm flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to exams
          </button>
          <Link to={`/report/${id}`} className="btn-secondary text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Download PDF / summary
          </Link>
        </div>

        <MockExamReview exam={exam} onRetake={() => navigate('/mock-exam')} />
      </div>
    </AppShell>
  )
}
