import { useState } from 'react'
import { adminAPI } from '../../api/admin.api'
import QuestionPreviewTable from './QuestionPreviewTable'
import { Cpu, Sparkles, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubjectsForExamType, GHANAIAN_LANGUAGES, AI_RISK_SUBJECTS } from '../../constants/subjects'

const BLANK_CONFIG = {
  subject: 'Mathematics', examType: 'WASSCE',
  topic: '', subtopic: '', year: 2023,
  difficulty: 3, type: 'MCQ', count: 5,
}

export default function AIGeneratorPanel() {
  const [config,   setConfig]   = useState(BLANK_CONFIG)
  const [loading,  setLoading]  = useState(false)
  const [previews, setPreviews] = useState(null)

  const handleChange = (e) => {
    setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleGenerate = async () => {
    if (!config.topic.trim()) return toast.error('Please enter a topic')
    setLoading(true)
    setPreviews(null)
    try {
      const data = await adminAPI.generateQuestions({
        ...config,
        difficulty: Number(config.difficulty),
        count:      Number(config.count),
        year:       Number(config.year),
      })
      setPreviews(data.previews)
      toast.success(`${data.count} questions generated — review below`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approved) => {
    try {
      const data = await adminAPI.approveQuestions(approved)
      toast.success(data.message)
      setPreviews(null)
      setConfig(BLANK_CONFIG)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Cpu className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3
            className="font-semibold text-slate-800"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            AI Question Generator
          </h3>
          <p className="text-sm text-slate-500">
            Gemini generates WAEC-style questions. Review and edit before saving.
          </p>
        </div>
      </div>

      {/* Config form — hidden when previews are showing */}
      {!previews && (
        <div className="card space-y-4">

          {/* Subject + exam type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subject</label>
              <select name="subject" value={config.subject} onChange={handleChange} className="input">
                {getSubjectsForExamType(config.examType)
                  .filter(s => !GHANAIAN_LANGUAGES.includes(s))
                  .map(s => <option key={s}>{s}</option>)}
                {config.examType === 'BECE' && (
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
                    onClick={() => setConfig(p => ({
                      ...p,
                      examType: t,
                      subject: getSubjectsForExamType(t).includes(p.subject)
                        ? p.subject
                        : getSubjectsForExamType(t)[0],
                    }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                      config.examType === t
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

          {/* Topic + subtopic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Topic *</label>
              <input
                type="text" name="topic" value={config.topic}
                onChange={handleChange} placeholder="e.g. Quadratic Equations"
                className="input"
              />
            </div>
            <div>
              <label className="label">
                Subtopic <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text" name="subtopic" value={config.subtopic}
                onChange={handleChange} placeholder="e.g. Completing the square"
                className="input"
              />
            </div>
          </div>

          {/* Type / difficulty / year / count */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="label">Type</label>
              <select name="type" value={config.type} onChange={handleChange} className="input">
                <option>MCQ</option>
                <option>Structured</option>
                <option>Essay</option>
              </select>
            </div>
            <div>
              <label className="label">Difficulty (1–5)</label>
              <input
                type="number" name="difficulty" value={config.difficulty}
                onChange={handleChange} min={1} max={5} className="input"
              />
            </div>
            <div>
              <label className="label">Year style</label>
              <input
                type="number" name="year" value={config.year}
                onChange={handleChange} min={2010} max={2025} className="input"
              />
            </div>
            <div>
              <label className="label">Count (1–20)</label>
              <input
                type="number" name="count" value={config.count}
                onChange={handleChange} min={1} max={20} className="input"
              />
            </div>
          </div>

          {/* Difficulty guide */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <span className="font-medium">Difficulty guide: </span>
            1 = Foundation · 2 = Standard · 3 = Intermediate · 4 = Advanced · 5 = Examiner level
          </div>

          {/* AI reliability warning for Ghanaian languages */}
          {AI_RISK_SUBJECTS.includes(config.subject) && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold">Review carefully before saving.</span> AI fluency and
                orthographic accuracy in {config.subject} is far less reliable than in English —
                generated text may contain grammatical or spelling errors a non-speaker admin won't
                catch. You'll be asked to confirm you've checked the language before approving.
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading
              ? <><span className="spinner border-white/40 border-t-white" /> Generating with Gemini…</>
              : <><Sparkles className="w-4 h-4" /> Generate {config.count} {config.type} question{Number(config.count) !== 1 ? 's' : ''}</>
            }
          </button>
        </div>
      )}

      {/* Review table after generation */}
      {previews && (
        <QuestionPreviewTable
          previews={previews}
          onApprove={handleApprove}
          onCancel={() => setPreviews(null)}
        />
      )}
    </div>
  )
}