import { FileText, Clock, BookOpen, AlertTriangle } from 'lucide-react'

// ── ExamCoverPage ──────────────────────────────────────────────
// Displays the formal WAEC examination cover page before
// the student starts the timed exam.
// Mirrors the layout of a real WAEC paper cover.
export default function ExamCoverPage({ exam, onStart, isStarting }) {
  const year = exam.year || new Date().getFullYear()

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">

      {/* Official exam header — formal document style */}
      <div className="card shadow-lg border-2 border-slate-200 overflow-hidden">

        {/* Dark header band */}
        <div
          className="px-8 py-6 text-center"
          style={{ background: 'linear-gradient(135deg, #134E4A 0%, #0D3B37 100%)' }}
        >
          <p className="text-teal-300 text-xs font-medium tracking-widest uppercase mb-2">
            West African Examinations Council
          </p>
          <h1
            className="text-white text-xl font-bold leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {exam.examType} — {exam.subject}
          </h1>
          <p className="text-teal-200 text-sm mt-1">
            AI-Generated Practice Examination · {year}
          </p>
        </div>

        {/* Paper details */}
        <div className="px-8 py-6 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-xs text-slate-500 mb-0.5">Time allowed</p>
              <p className="font-semibold text-slate-800 text-sm">2 hours 40 minutes</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xs text-slate-500 mb-0.5">Total marks</p>
              <p className="font-semibold text-slate-800 text-sm">100 marks</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-slate-500 mb-0.5">Sections</p>
              <p className="font-semibold text-slate-800 text-sm">A · B · C</p>
            </div>
          </div>
        </div>

        {/* Paper structure */}
        <div className="px-8 py-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}>
            Paper structure
          </h3>
          <div className="space-y-2.5">
            {[
              {
                section: 'Section A',
                desc:    'Multiple Choice Questions',
                detail:  '40 questions · 1 mark each · 40 marks',
                time:    '45 minutes',
                colour:  'bg-teal-50 border-teal-200 text-teal-800',
              },
              {
                section: 'Section B',
                desc:    'Structured Questions',
                detail:  '4 questions · 10 marks each · 40 marks',
                time:    '60 minutes',
                colour:  'bg-blue-50 border-blue-200 text-blue-800',
              },
              {
                section: 'Section C',
                desc:    'Essay Question',
                detail:  '2 questions, answer ONE · 20 marks',
                time:    '35 minutes',
                colour:  'bg-purple-50 border-purple-200 text-purple-800',
              },
            ].map(({ section, desc, detail, time, colour }) => (
              <div key={section} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colour}`}>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{section} — {desc}</p>
                  <p className="text-xs opacity-70 mt-0.5">{detail}</p>
                </div>
                <span className="text-xs font-medium opacity-60 flex-shrink-0">{time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="px-8 py-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}>
            Instructions to candidates
          </h3>
          <ul className="space-y-1.5">
            {[
              'Answer ALL questions in Section A.',
              'Answer ALL questions in Section B.',
              'Answer ONE question only from Section C.',
              'All answers must be written clearly and legibly.',
              'Marks will not be awarded for illegible responses.',
              'This paper must not be taken out of the examination room.',
            ].map(instruction => (
              <li key={instruction} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                {instruction}
              </li>
            ))}
          </ul>
        </div>

        {/* Warning + start */}
        <div className="px-8 py-6">
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Once you start, the timer begins immediately.
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your answers are auto-saved as you work.
                You can navigate between sections at any time.
              </p>
            </div>
          </div>

          <button
            onClick={onStart}
            disabled={isStarting}
            className="btn-primary w-full py-4 text-base"
          >
            {isStarting
              ? <><span className="spinner border-white/40 border-t-white" /> Preparing paper…</>
              : 'Begin examination'
            }
          </button>
        </div>
      </div>
    </div>
  )
}