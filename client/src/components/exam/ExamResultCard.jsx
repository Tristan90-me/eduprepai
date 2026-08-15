import { useNavigate } from 'react-router-dom'
import { Trophy, RotateCcw, TrendingUp, FileText } from 'lucide-react'

// ── Grade colour map ───────────────────────────────────────────
const gradeColour = (grade) => {
  if (['A1', 'B2', 'B3'].includes(grade)) return 'text-green-700 bg-green-50 border-green-300'
  if (['C4', 'C5', 'C6'].includes(grade)) return 'text-teal-700 bg-teal-50 border-teal-300'
  if (['D7', 'E8'].includes(grade))       return 'text-amber-700 bg-amber-50 border-amber-300'
  return 'text-red-700 bg-red-50 border-red-300'
}

// ── ExamResultCard ─────────────────────────────────────────────
// Full results screen shown after the exam is marked.
export default function ExamResultCard({ results, subject, examType, onRetake }) {
  const navigate = useNavigate()

  const {
    sectionAMarks, sectionBMarks, sectionCMarks,
    totalMarks, availableMarks, percent,
    waecGrade, gradeLabel, examinerComment,
  } = results

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* Hero result card */}
      <div className="card shadow-lg text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>

        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          {examType} {subject} — Practice Result
        </p>

        <p
          className="text-4xl font-bold text-slate-900 mb-1"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {totalMarks}<span className="text-xl text-slate-400">/{availableMarks}</span>
        </p>

        <p className="text-slate-500 text-sm mb-5">{percent}% — {gradeLabel}</p>

        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-bold text-2xl ${gradeColour(waecGrade)}`}>
          {waecGrade}
          <span className="text-base font-medium opacity-70">{gradeLabel}</span>
        </div>
      </div>

      {/* Section breakdown */}
      <div className="card">
        <h3 className="section-title">Section breakdown</h3>
        <div className="space-y-3">
          {[
            { label: 'Section A — MCQ',        marks: sectionAMarks, total: 40, colour: 'bg-teal-500'   },
            { label: 'Section B — Structured', marks: sectionBMarks, total: 40, colour: 'bg-blue-500'   },
            { label: 'Section C — Essay',      marks: sectionCMarks, total: 20, colour: 'bg-purple-500' },
          ].map(({ label, marks, total, colour }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-500 font-semibold">
                  {marks}/{total} ({Math.round((marks/total)*100)}%)
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${colour}`}
                  style={{ width: `${Math.round((marks/total)*100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Examiner comment */}
      {examinerComment && (
        <div className="card border-l-4 border-teal-400">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Examiner's comment
          </p>
          <p className="text-sm text-slate-700 leading-relaxed italic">
            "{examinerComment}"
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onRetake}
          className="btn-secondary flex flex-col items-center gap-1.5 py-4"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-xs">Retake exam</span>
        </button>
        <button
          onClick={() => navigate('/predict')}
          className="btn-secondary flex flex-col items-center gap-1.5 py-4"
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs">Predictions</span>
        </button>
        <button
          onClick={() => navigate('/practice')}
          className="btn-primary flex flex-col items-center gap-1.5 py-4"
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs">Practice gaps</span>
        </button>
      </div>
    </div>
  )
}