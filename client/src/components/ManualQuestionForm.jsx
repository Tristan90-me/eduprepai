import { useState } from 'react'
import { Plus } from 'lucide-react'
import { getSubjectsForExamType, GHANAIAN_LANGUAGES } from '../constants/subjects'

const blankFor = (subject, examType) => ({
  subject, examType, year: 2023,
  topic: '', subtopic: '', syllabusReference: '',
  type: 'MCQ', difficulty: 3, marks: 1, section: 'A',
  questionText: '', options: ['', '', '', ''],
  correctOption: 'A', modelAnswer: '', parts: [],
  questionSource: 'pastPaper',
})

// ── ManualQuestionForm ───────────────────────────────────────────
// Extracted from AdminPage.jsx's inline "Add Manually" tab so it can
// be reused by the teacher portal's assignment builder too.
//
// - Admin usage: pass no `subject`/`examType` — the form shows its own
//   pickers, `showQuestionSource` defaults true (past-paper-vs-practice
//   matters for the shared bank's topic predictions).
// - Teacher usage: pass a fixed `subject`/`examType` (inherited from the
//   class the assignment targets, so it can't drift from the class the
//   questions are meant for) and `showQuestionSource={false}` — that
//   toggle is meaningless for assignment questions, which never enter
//   the shared bank.
export default function ManualQuestionForm({
  subject: fixedSubject,
  examType: fixedExamType,
  showQuestionSource = true,
  submitLabel = 'Add question',
  onAdd,
}) {
  const [form, setForm] = useState(() => blankFor(fixedSubject || 'Mathematics', fixedExamType || 'WASSCE'))
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleOptionChange = (i, val) => {
    const opts = [...form.options]; opts[i] = val
    setForm({ ...form, options: opts })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = form.type === 'MCQ'
        ? form
        : { ...form, options: [], correctOption: '' }
      await onAdd(payload)
      setForm(blankFor(fixedSubject || form.subject, fixedExamType || form.examType))
    } catch {
      // onAdd already surfaced the error (toast) — just keep the form
      // filled in so the teacher/admin doesn't have to retype it.
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {!fixedSubject && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Subject</label>
            <select name="subject" value={form.subject} onChange={handleChange} className="input">
              {getSubjectsForExamType(form.examType)
                .filter(s => !GHANAIAN_LANGUAGES.includes(s))
                .map(s => <option key={s}>{s}</option>)}
              {form.examType === 'BECE' && (
                <optgroup label="Ghanaian Language">
                  {GHANAIAN_LANGUAGES.map(s => <option key={s}>{s}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="label">Exam type</label>
            <div className="flex gap-2">
              {['WASSCE', 'BECE'].map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setForm(p => ({
                    ...p,
                    examType: t,
                    subject: getSubjectsForExamType(t).includes(p.subject)
                      ? p.subject
                      : getSubjectsForExamType(t)[0],
                  }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                    form.examType === t
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="label">
            {form.questionSource === 'practice' ? 'Year (reference only)' : 'Year'}
          </label>
          <input type="number" name="year" value={form.year}
            onChange={handleChange} min={2010} max={2025} className="input" />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="input">
            <option>MCQ</option>
            <option>Structured</option>
            <option>Essay</option>
          </select>
        </div>
        <div>
          <label className="label">Difficulty (1–5)</label>
          <input type="number" name="difficulty" value={form.difficulty}
            onChange={handleChange} min={1} max={5} className="input" />
        </div>
        <div>
          <label className="label">Marks</label>
          <input type="number" name="marks" value={form.marks}
            onChange={handleChange} min={1} className="input" />
        </div>
      </div>

      {/* Past paper vs practice — controls whether this question
         counts toward topic predictions. Practice content is
         still fully usable for practice sessions and mock exams. */}
      {showQuestionSource && (
        <div>
          <label className="label">Question type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, questionSource: 'pastPaper' }))}
              className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium text-left transition-colors ${
                form.questionSource === 'pastPaper'
                  ? 'border-teal-400 bg-teal-50 text-teal-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Past paper
              <p className="text-xs font-normal opacity-70 mt-0.5">Counts toward topic predictions</p>
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, questionSource: 'practice' }))}
              className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium text-left transition-colors ${
                form.questionSource === 'practice'
                  ? 'border-teal-400 bg-teal-50 text-teal-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Practice / supplementary
              <p className="text-xs font-normal opacity-70 mt-0.5">Excluded from topic predictions</p>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Topic *</label>
          <input type="text" name="topic" value={form.topic}
            onChange={handleChange} placeholder="e.g. Algebra" className="input" required />
        </div>
        <div>
          <label className="label">Subtopic</label>
          <input type="text" name="subtopic" value={form.subtopic}
            onChange={handleChange} placeholder="e.g. Quadratic Equations" className="input" />
        </div>
      </div>

      <div>
        <label className="label">Question text *</label>
        <textarea
          name="questionText" value={form.questionText}
          onChange={handleChange} required rows={3}
          className="input resize-none"
          placeholder="Enter the full question text..."
        />
      </div>

      {/* MCQ options */}
      {form.type === 'MCQ' && (
        <div>
          <label className="label">Options</label>
          <div className="space-y-2">
            {['A', 'B', 'C', 'D'].map((l, i) => (
              <div key={l} className="flex items-center gap-2">
                <span className={`text-xs font-bold w-5 flex-shrink-0 ${form.correctOption === l ? 'text-teal-600' : 'text-slate-400'}`}>
                  {l}.
                </span>
                <input
                  type="text" value={form.options[i]}
                  onChange={e => handleOptionChange(i, e.target.value)}
                  className="input flex-1" required
                />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, correctOption: l }))}
                  className={`text-xs px-2 py-1.5 rounded-lg transition-colors border ${
                    form.correctOption === l
                      ? 'bg-teal-50 text-teal-700 border-teal-300 font-semibold'
                      : 'text-slate-400 border-slate-200 hover:text-teal-600'
                  }`}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model answer */}
      {form.type !== 'MCQ' && (
        <div>
          <label className="label">Model answer / marking guide</label>
          <textarea
            name="modelAnswer" value={form.modelAnswer}
            onChange={handleChange} rows={4}
            className="input resize-none"
            placeholder="Expected answer and marking points..."
          />
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
        {loading
          ? <><span className="spinner border-white/40 border-t-white" /> Saving…</>
          : <><Plus className="w-4 h-4" /> {submitLabel}</>
        }
      </button>
    </form>
  )
}
