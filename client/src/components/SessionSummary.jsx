import { useNavigate } from 'react-router-dom'
import { Trophy, Target, Clock, TrendingUp, RotateCcw, BarChart2 } from 'lucide-react'
import MasteryBadge from './MasteryBadge'

// ── Grade colours ──────────────────────────────────────────────
const gradeColour = (grade) => {
  if (['A1','B2','B3'].includes(grade)) return 'text-green-600 bg-green-50 border-green-200'
  if (['C4','C5','C6'].includes(grade)) return 'text-teal-600 bg-teal-50 border-teal-200'
  if (['D7','E8'].includes(grade))       return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

// ── SessionSummary ─────────────────────────────────────────────
// Shown at the end of a practice session.
// Displays score, grade, accuracy, mastery changes, and actions.
export default function SessionSummary({
  subject,
  topic,
  totalMarks,
  availableMarks,
  accuracy,
  duration,
  grade,           // { grade, label, percent }
  masteryUpdates,  // array of { topic, oldScore, newScore }
  onPracticeAgain,
}) {
  const navigate = useNavigate()

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* ── Score hero card ────────────────────────────────── */}
      <div className="card text-center py-8 shadow-md">
        <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>

        <p
          className="text-3xl font-bold text-slate-900 mb-1"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {totalMarks} / {availableMarks}
        </p>
        <p className="text-slate-500 text-sm mb-4">marks scored</p>

        {grade && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-lg ${gradeColour(grade.grade)}`}>
            {grade.grade}
            <span className="text-sm font-medium opacity-70">{grade.label}</span>
          </div>
        )}
      </div>

      {/* ── Stats row ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon:    Target,
            colour:  'bg-teal-100 text-teal-600',
            value:   `${accuracy}%`,
            label:   'Accuracy',
          },
          {
            icon:    Clock,
            colour:  'bg-blue-100 text-blue-600',
            value:   `${minutes}m ${seconds}s`,
            label:   'Time taken',
          },
          {
            icon:    TrendingUp,
            colour:  'bg-amber-100 text-amber-600',
            value:   masteryUpdates?.filter(u => u.newScore > u.oldScore).length || 0,
            label:   'Topics improved',
          },
        ].map(({ icon: Icon, colour, value, label }) => (
          <div key={label} className="card text-center py-4">
            <div className={`w-9 h-9 rounded-xl ${colour} flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
              {value}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Mastery changes ────────────────────────────────── */}
      {masteryUpdates?.length > 0 && (
        <div className="card">
          <h3 className="section-title flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-teal-600" />
            Mastery updates
          </h3>
          <div className="space-y-3">
            {masteryUpdates.map(update => (
              <div key={update.topic} className="flex items-center gap-3">
                <span className="text-sm text-slate-700 flex-1 min-w-0 truncate font-medium">
                  {update.topic}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400">{update.oldScore}</span>
                  <div className="w-16 bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${
                        update.newScore >= update.oldScore ? 'bg-teal-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${update.newScore}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${
                    update.newScore > update.oldScore
                      ? 'text-green-600'
                      : update.newScore < update.oldScore
                      ? 'text-red-500'
                      : 'text-slate-400'
                  }`}>
                    {update.newScore > update.oldScore ? '+' : ''}
                    {update.newScore - update.oldScore}
                  </span>
                </div>
                <MasteryBadge score={update.newScore} size="sm" showLabel={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action buttons ─────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          onClick={onPracticeAgain}
          className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Practice again
        </button>
        <button
          onClick={() => navigate('/predict')}
          className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          View predictions
        </button>
      </div>
    </div>
  )
}