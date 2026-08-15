import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

// ── QuestionPreviewTable ───────────────────────────────────────
// Shows AI-generated or PDF-extracted questions for admin review.
// Admin can select, edit, or delete individual questions before
// approving the final set to be saved to MongoDB.
export default function QuestionPreviewTable({ previews, onApprove, onCancel }) {
  const [selected,  setSelected]  = useState(() => new Set(previews.map(q => q.previewId)))
  const [questions, setQuestions] = useState(previews)
  const [expanded,  setExpanded]  = useState(null)
  const [saving,    setSaving]    = useState(false)

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(
      selected.size === questions.length
        ? new Set()
        : new Set(questions.map(q => q.previewId))
    )
  }

  const deleteQuestion = (id) => {
    setQuestions(p => p.filter(q => q.previewId !== id))
    setSelected(p => { const n = new Set(p); n.delete(id); return n })
  }

  const editField = (id, field, value) => {
    setQuestions(p => p.map(q => q.previewId === id ? { ...q, [field]: value } : q))
  }

  const handleApprove = async () => {
    const toSave = questions.filter(q => selected.has(q.previewId))
    if (!toSave.length) return
    setSaving(true)
    await onApprove(toSave)
    setSaving(false)
  }

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size === questions.length && questions.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 accent-teal-600"
          />
          <span className="text-sm text-slate-600">
            {selected.size} of {questions.length} selected
          </span>
        </label>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={!selected.size || saving}
            className="btn-primary text-sm"
          >
            {saving
              ? <><span className="spinner border-white/40 border-t-white" /> Saving…</>
              : `Save ${selected.size} question${selected.size !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>

      {/* Question rows */}
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div
            key={q.previewId}
            className={`card border-2 transition-colors ${
              selected.has(q.previewId)
                ? 'border-teal-300 bg-teal-50/20'
                : 'border-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(q.previewId)}
                onChange={() => toggleSelect(q.previewId)}
                className="w-4 h-4 mt-0.5 accent-teal-600 flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-xs text-slate-400 font-medium">#{idx + 1}</span>
                  <span className="badge-purple">{q.type}</span>
                  <span className="badge-blue">Sec {q.section}</span>
                  <span className="badge-gray">Diff {q.difficulty}/5</span>
                  <span className="badge-gray">{q.marks}m</span>
                  {q.isAIGenerated   && <span className="badge-amber">AI generated</span>}
                  {q.isPDFExtracted  && <span className="badge-green">PDF extracted</span>}
                  {q.topic           && <span className="badge-teal">{q.topic}</span>}
                </div>

                {/* Editable question text */}
                <textarea
                  value={q.questionText}
                  onChange={e => editField(q.previewId, 'questionText', e.target.value)}
                  rows={2}
                  className="input text-sm resize-none w-full"
                />
              </div>

              {/* Expand / delete */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setExpanded(expanded === q.previewId ? null : q.previewId)}
                  className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  aria-label="Toggle details"
                >
                  {expanded === q.previewId
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                </button>
                <button
                  onClick={() => deleteQuestion(q.previewId)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded detail panel */}
            {expanded === q.previewId && (
              <div className="mt-4 pl-7 pt-4 border-t border-slate-100 space-y-3">

                {/* MCQ options */}
                {q.type === 'MCQ' && q.options?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Options</p>
                    {['A', 'B', 'C', 'D'].map((letter, i) => (
                      <div key={letter} className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs font-bold w-5 ${q.correctOption === letter ? 'text-teal-600' : 'text-slate-400'}`}>
                          {letter}.
                        </span>
                        <input
                          type="text"
                          value={q.options[i] || ''}
                          onChange={e => {
                            const opts = [...(q.options || [])]
                            opts[i] = e.target.value
                            editField(q.previewId, 'options', opts)
                          }}
                          className="input text-sm flex-1"
                        />
                        <button
                          onClick={() => editField(q.previewId, 'correctOption', letter)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            q.correctOption === letter
                              ? 'bg-teal-100 text-teal-700 font-semibold'
                              : 'text-slate-400 hover:text-teal-600'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Model answer */}
                {q.modelAnswer && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Model answer / marking guide</p>
                    <textarea
                      value={q.modelAnswer}
                      onChange={e => editField(q.previewId, 'modelAnswer', e.target.value)}
                      rows={3}
                      className="input text-sm resize-none w-full"
                    />
                  </div>
                )}

                {/* Editable metadata */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Topic</label>
                    <input
                      type="text"
                      value={q.topic || ''}
                      onChange={e => editField(q.previewId, 'topic', e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Difficulty (1–5)</label>
                    <input
                      type="number" min={1} max={5}
                      value={q.difficulty || 3}
                      onChange={e => editField(q.previewId, 'difficulty', Number(e.target.value))}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Year</label>
                    <input
                      type="number"
                      value={q.year || 2023}
                      onChange={e => editField(q.previewId, 'year', Number(e.target.value))}
                      className="input text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}