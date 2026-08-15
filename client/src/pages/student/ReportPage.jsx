import { useState, useEffect }  from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell                   from '../../components/layout/AppShell'
import { reportAPI }              from '../../api/report.api'
import { Download, Trophy, ArrowLeft, FileText, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Grade colour helper ────────────────────────────────────────
const gradeColour = (grade) => {
  if (['A1','B2','B3'].includes(grade)) return 'text-green-700 bg-green-50 border-green-300'
  if (['C4','C5','C6'].includes(grade)) return 'text-teal-700 bg-teal-50 border-teal-300'
  if (['D7','E8'].includes(grade))       return 'text-amber-700 bg-amber-50 border-amber-300'
  return 'text-red-700 bg-red-50 border-red-300'
}

export default function ReportPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [report,   setReport]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await reportAPI.getPreview(id)
        setReport(data.report)
      } catch (err) {
        toast.error(err.message)
        navigate('/mock-exam')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await reportAPI.download(id)
      toast.success('Report downloaded!')
    } catch (err) {
      toast.error('Download failed: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <AppShell title="Exam Report" subtitle="Loading…">
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppShell>
  )

  if (!report) return null

  const { results, subject, examType, student, submittedAt, sectionB, sectionC } = report

  return (
    <AppShell
      title="Exam Report"
      subtitle={`${subject} · ${examType} · ${new Date(submittedAt).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}`}
    >
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Actions bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/mock-exam')}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to exams
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {downloading
              ? <><span className="spinner border-white/40 border-t-white" /> Generating PDF…</>
              : <><Download className="w-4 h-4" /> Download PDF report</>
            }
          </button>
        </div>

        {/* Score summary */}
        <div className="card shadow-md text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <p className="text-4xl font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {results.totalMarks}<span className="text-xl text-slate-400">/{results.availableMarks}</span>
          </p>
          <p className="text-slate-500 text-sm mb-4">{results.percent}% · {results.gradeLabel}</p>
          <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-bold text-2xl ${gradeColour(results.waecGrade)}`}>
            {results.waecGrade}
            <span className="text-sm font-medium opacity-70">{results.gradeLabel}</span>
          </span>
        </div>

        {/* Section scores */}
        <div className="card">
          <h3 className="section-title">Section breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Section A — MCQ',        marks: results.sectionAMarks, total: 40, colour: 'bg-teal-500'   },
              { label: 'Section B — Structured', marks: results.sectionBMarks, total: 40, colour: 'bg-blue-500'   },
              { label: 'Section C — Essay',      marks: results.sectionCMarks, total: 20, colour: 'bg-purple-500' },
            ].map(({ label, marks, total, colour }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="text-slate-600 font-semibold">
                    {marks}/{total} ({Math.round((marks/total)*100)}%)
                  </span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${colour}`} style={{ width: `${Math.round((marks/total)*100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Examiner comment */}
        {results.examinerComment && (
          <div className="card border-l-4 border-teal-400">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Examiner's comment
            </p>
            <p className="text-sm text-slate-700 leading-relaxed italic">
              "{results.examinerComment}"
            </p>
          </div>
        )}

        {/* Section B detailed review */}
        {sectionB?.length > 0 && (
          <div className="card">
            <h3 className="section-title flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Section B — Structured question feedback
            </h3>
            <div className="space-y-4">
              {sectionB.map((q, i) => (
                <div key={i} className={`rounded-xl border p-4 ${
                  (q.marksAwarded / q.marks) >= 0.5 ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {(q.marksAwarded / q.marks) >= 0.5
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-orange-500" />
                    }
                    <span className="font-semibold text-sm text-slate-800">
                      Question {i + 1} — {q.topic}
                    </span>
                    <span className="ml-auto text-sm font-bold text-teal-700">
                      {q.marksAwarded}/{q.marks}
                    </span>
                  </div>
                  {q.aiFeedback && (
                    <p className="text-sm text-slate-600 mb-2">{q.aiFeedback}</p>
                  )}
                  {q.partResults?.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      {q.partResults.map((pr, pi) => (
                        <div key={pi} className="flex gap-2 text-xs text-slate-600">
                          <span className="font-semibold text-blue-600">({pr.part})</span>
                          <span>{pr.marksAwarded}/{pr.marksAvailable}m —</span>
                          <span className="flex-1">{pr.feedback}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section C essay feedback */}
        {sectionC?.length > 0 && sectionC[0] && (
          <div className="card">
            <h3 className="section-title flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Section C — Essay feedback
            </h3>
            {sectionC.map((q, i) => (
              <div key={i} className={`rounded-xl border p-4 ${
                q.marksAwarded >= 10 ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {q.marksAwarded >= 10
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-orange-500" />
                  }
                  <span className="font-semibold text-sm text-slate-800">Essay — {q.topic}</span>
                  <span className="ml-auto text-sm font-bold text-teal-700">{q.marksAwarded}/{q.marks}</span>
                </div>
                {q.aiFeedback && <p className="text-sm text-slate-600 mb-2">{q.aiFeedback}</p>}
                {q.partResults?.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Criteria</p>
                    {q.partResults.map((cr, ci) => (
                      <div key={ci} className="flex gap-2 text-xs">
                        <span className="font-semibold text-purple-600 w-36 flex-shrink-0 truncate">
                          {cr.name || cr.part}
                        </span>
                        <span className="text-slate-500">{cr.marksAwarded}/{cr.marksAvailable}m —</span>
                        <span className="flex-1 text-slate-600">{cr.feedback}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  )
}