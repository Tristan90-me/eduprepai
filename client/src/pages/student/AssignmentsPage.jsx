import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import { assignmentAPI } from '../../api/assignment.api'
import { useAuth } from '../../context/AuthContext'
import { ClipboardList, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_LABEL = {
  assigned:       { label: 'Not started',      className: 'badge-gray'  },
  in_progress:    { label: 'In progress',      className: 'badge-amber' },
  submitted:      { label: 'Marking…',         className: 'badge-amber' },
  pending_review: { label: 'Awaiting review',  className: 'badge-amber' },
  marked:         { label: 'Marked',           className: 'badge-teal'  },
}

// ── AssignmentsPage ──────────────────────────────────────────────
// Lists remedial assignments a teacher has sent this student, filtered
// to their registered subjects (an assignment can only ever come from
// a class the student joined for one of their subjects anyway, but the
// filter tab still helps once a student has several).
export default function AssignmentsPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [subjectFilter, setSubjectFilter] = useState('')

  useEffect(() => { load() }, [subjectFilter])

  const load = async () => {
    setLoading(true)
    try {
      const data = await assignmentAPI.getMyAssignments(subjectFilter || undefined)
      setAssignments(data.assignments || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="Assignments" subtitle="Remedial work your teachers have sent you">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Subject filter */}
        {user?.subjects?.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSubjectFilter('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                !subjectFilter ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              All subjects
            </button>
            {user.subjects.map(s => (
              <button
                key={s}
                onClick={() => setSubjectFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                  subjectFilter === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && <p className="text-sm text-slate-400 text-center py-10">Loading assignments…</p>}

        {!loading && assignments.length === 0 && (
          <div className="card text-center py-14 border-dashed border-2 border-slate-200">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No assignments yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Ask your teacher for a class join code, then add it in Settings → Classes.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {assignments.map(a => {
            const status = STATUS_LABEL[a.status] || STATUS_LABEL.assigned
            return (
              <button
                key={a.submissionId}
                onClick={() => navigate(`/assignments/${a.submissionId}`)}
                className="card w-full flex items-center justify-between gap-4 text-left hover:border-teal-300 border-2 border-transparent transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={status.className}>{status.label}</span>
                    <span className="text-xs text-slate-400">{a.subject} · {a.className}</span>
                  </div>
                  <p className="font-medium text-slate-800 truncate">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {a.questionCount} question{a.questionCount !== 1 ? 's' : ''}
                    {a.status === 'marked' && ` · ${a.totalMarks}/${a.availableMarks} (${a.percent}%)`}
                    {a.dueDate && ` · Due ${new Date(a.dueDate).toLocaleDateString('en-GB')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.status === 'marked'
                    ? <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    : <Clock className="w-5 h-5 text-slate-300" />
                  }
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
