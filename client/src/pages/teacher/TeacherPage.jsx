import { useState, useEffect } from 'react'
import TeacherShell          from '../../components/layout/TeacherShell'
import AIGeneratorPanel      from '../../components/admin/AIGeneratorPanel'
import PDFExtractorPanel     from '../../components/admin/PDFExtractorPanel'
import ManualQuestionForm    from '../../components/ManualQuestionForm'
import SubmissionReviewPanel from '../../components/teacher/SubmissionReviewPanel'
import { teacherAPI }       from '../../api/teacher.api'
import {
  Users, Plus, Cpu, FileSearch, Type, Trash2,
  Copy, ClipboardList, ArrowRight, X, ClipboardCheck, Camera,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubjectsForExamType, GHANAIAN_LANGUAGES } from '../../constants/subjects'

const TABS = [
  { id: 'classes',    label: 'My Classes',    icon: Users },
  { id: 'assignment', label: 'New Assignment', icon: ClipboardList },
  { id: 'review',     label: 'Review Submissions', icon: ClipboardCheck },
]

export default function TeacherPage() {
  const [tab, setTab] = useState('classes')

  // ── Classes ──────────────────────────────────────────────────
  const [classes,       setClasses]       = useState([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [newClass, setNewClass] = useState({ name: '', subject: 'Mathematics', examType: 'WASSCE' })
  const [creatingClass, setCreatingClass] = useState(false)
  const [expandedClassId, setExpandedClassId] = useState(null) // which class's roster is shown

  // ── Assignments overview (per class, shown under Classes tab) ──
  const [assignments,        setAssignments]        = useState([])
  const [assignmentsLoading, setAssignmentsLoading]  = useState(false)

  // ── New assignment builder ──────────────────────────────────
  const [selectedClassId, setSelectedClassId] = useState('')
  const [title,   setTitle]   = useState('')
  const [dueDate, setDueDate] = useState('')
  const [draftQuestions, setDraftQuestions] = useState([])
  const [activeTool, setActiveTool] = useState(null) // 'ai' | 'pdf' | 'manual' | null
  const [creatingAssignment, setCreatingAssignment] = useState(false)

  // ── Review queue ─────────────────────────────────────────────
  const [pendingReviews,  setPendingReviews]  = useState([])
  const [reviewsLoading,  setReviewsLoading]  = useState(false)
  const [reviewingId,     setReviewingId]     = useState(null) // submissionId currently open, or null for the list

  const selectedClass = classes.find(c => c._id === selectedClassId)

  useEffect(() => { loadClasses() }, [])
  useEffect(() => { if (tab === 'classes') loadAssignments() }, [tab])
  useEffect(() => { if (tab === 'review') loadPendingReviews() }, [tab])

  const loadPendingReviews = async () => {
    setReviewsLoading(true)
    try {
      const data = await teacherAPI.getPendingReviews()
      setPendingReviews(data.submissions || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setReviewsLoading(false)
    }
  }

  const loadClasses = async () => {
    setClassesLoading(true)
    try {
      const data = await teacherAPI.getClasses()
      setClasses(data.classes || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setClassesLoading(false)
    }
  }

  const loadAssignments = async () => {
    setAssignmentsLoading(true)
    try {
      const data = await teacherAPI.getAssignments()
      setAssignments(data.assignments || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAssignmentsLoading(false)
    }
  }

  const handleCreateClass = async (e) => {
    e.preventDefault()
    setCreatingClass(true)
    try {
      const data = await teacherAPI.createClass(newClass)
      toast.success(`Class created — join code ${data.class.joinCode}`)
      setNewClass({ name: '', subject: 'Mathematics', examType: 'WASSCE' })
      loadClasses()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreatingClass(false)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    toast.success('Join code copied')
  }

  // Sub-tools each call this once their own QuestionPreviewTable/form
  // approval step runs — merges into the running draft rather than
  // saving anywhere yet. Nothing is persisted until "Create & assign".
  const addToDraft = (questions) => {
    setDraftQuestions(prev => [...prev, ...questions])
    setActiveTool(null)
    toast.success(`${questions.length} question${questions.length !== 1 ? 's' : ''} added to assignment draft`)
  }

  const removeFromDraft = (idx) => {
    setDraftQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const totalMarks = draftQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)

  const handleCreateAssignment = async () => {
    if (!selectedClassId) return toast.error('Select a class first')
    if (!title.trim())    return toast.error('Give the assignment a title')
    if (draftQuestions.length === 0) return toast.error('Add at least one question')

    setCreatingAssignment(true)
    try {
      const data = await teacherAPI.createAssignment({
        classId: selectedClassId,
        title,
        dueDate: dueDate || null,
        questions: draftQuestions,
      })
      toast.success(data.message)
      setTitle('')
      setDueDate('')
      setDraftQuestions([])
      setSelectedClassId('')
      setTab('classes')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreatingAssignment(false)
    }
  }

  return (
    <TeacherShell>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
              Classes & Assignments
            </p>
            <p className="text-xs text-slate-500">Set remedial work targeted at your students' gaps</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100/80 rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* ── My Classes tab ─────────────────────────────────── */}
        {tab === 'classes' && (
          <div className="space-y-5 animate-fade-in">

            {/* Create a class */}
            <div className="card">
              <h3 className="section-title flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Create a class
              </h3>
              <form onSubmit={handleCreateClass} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="label">Class name</label>
                  <input
                    type="text" value={newClass.name}
                    onChange={e => setNewClass(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Form 2 Remedial Maths" className="input" required
                  />
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select
                    value={newClass.subject}
                    onChange={e => setNewClass(p => ({ ...p, subject: e.target.value }))}
                    className="input"
                  >
                    {getSubjectsForExamType(newClass.examType)
                      .filter(s => !GHANAIAN_LANGUAGES.includes(s))
                      .map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Exam type</label>
                  <select
                    value={newClass.examType}
                    onChange={e => {
                      const examType = e.target.value
                      const subjects = getSubjectsForExamType(examType)
                      setNewClass(p => ({ ...p, examType, subject: subjects.includes(p.subject) ? p.subject : subjects[0] }))
                    }}
                    className="input"
                  >
                    <option>WASSCE</option>
                    <option>BECE</option>
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <button type="submit" disabled={creatingClass} className="btn-primary py-2.5">
                    {creatingClass ? <span className="spinner border-white/40 border-t-white" /> : <Plus className="w-4 h-4" />}
                    Create class
                  </button>
                </div>
              </form>
            </div>

            {/* Class list */}
            <div className="space-y-3">
              {classesLoading && <p className="text-sm text-slate-400 text-center py-6">Loading classes…</p>}
              {!classesLoading && classes.length === 0 && (
                <div className="card text-center py-10 border-dashed border-2 border-slate-200">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No classes yet — create one above to get a join code.</p>
                </div>
              )}
              {classes.map(c => (
                <div key={c._id} className="card">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{c.name}</p>
                      <button
                        onClick={() => setExpandedClassId(prev => prev === c._id ? null : c._id)}
                        className="text-xs text-slate-500 hover:text-blue-600 transition-colors underline decoration-dotted underline-offset-2"
                      >
                        {c.subject} · {c.examType} · {c.studentCount} student{c.studentCount !== 1 ? 's' : ''}
                      </button>
                    </div>
                    <button
                      onClick={() => copyCode(c.joinCode)}
                      className="btn-secondary text-sm"
                    >
                      <Copy className="w-3.5 h-3.5" /> {c.joinCode}
                    </button>
                  </div>

                  {expandedClassId === c._id && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      {c.students.length === 0 ? (
                        <p className="text-xs text-slate-400">No students have joined yet — share the join code above.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {c.students.map(s => (
                            <div key={s._id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">{s.fullName}</span>
                              <span className="text-xs text-slate-400">{s.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Assignments overview */}
            {assignments.length > 0 && (
              <div className="card">
                <h3 className="section-title">Assignments given</h3>
                <div className="space-y-2">
                  {assignments.map(a => (
                    <div key={a._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{a.title}</p>
                        <p className="text-xs text-slate-400">{a.subject} · {a.questionCount} question{a.questionCount !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="badge-blue text-xs">{a.submittedCount}/{a.totalStudents} submitted</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {assignmentsLoading && <p className="text-sm text-slate-400 text-center py-4">Loading assignments…</p>}
          </div>
        )}

        {/* ── New Assignment tab ─────────────────────────────── */}
        {tab === 'assignment' && (
          <div className="space-y-5 animate-fade-in">

            {classes.length === 0 ? (
              <div className="card text-center py-10 border-dashed border-2 border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Create a class first, under "My Classes".</p>
              </div>
            ) : (
              <>
                {/* Class + title + due date */}
                <div className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Class</label>
                    <select
                      value={selectedClassId}
                      onChange={e => setSelectedClassId(e.target.value)}
                      className="input"
                    >
                      <option value="">Select a class…</option>
                      {classes.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.subject})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Title</label>
                    <input
                      type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Week 3 Remedial" className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Due date <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input
                      type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                {selectedClass && (
                  <>
                    {/* Question source picker */}
                    {!activeTool && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button onClick={() => setActiveTool('ai')} className="card flex flex-col items-center gap-2 py-6 hover:border-blue-300 border-2 border-transparent transition-colors">
                          <Cpu className="w-6 h-6 text-purple-600" />
                          <span className="text-sm font-medium text-slate-700">AI Generate</span>
                        </button>
                        <button onClick={() => setActiveTool('pdf')} className="card flex flex-col items-center gap-2 py-6 hover:border-blue-300 border-2 border-transparent transition-colors">
                          <FileSearch className="w-6 h-6 text-green-600" />
                          <span className="text-sm font-medium text-slate-700">Upload PDF</span>
                        </button>
                        <button onClick={() => setActiveTool('manual')} className="card flex flex-col items-center gap-2 py-6 hover:border-blue-300 border-2 border-transparent transition-colors">
                          <Type className="w-6 h-6 text-teal-600" />
                          <span className="text-sm font-medium text-slate-700">Type manually</span>
                        </button>
                      </div>
                    )}

                    {activeTool && (
                      <div className="card">
                        <button
                          onClick={() => setActiveTool(null)}
                          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>

                        {activeTool === 'ai' && (
                          <AIGeneratorPanel
                            onGenerate={(config) => teacherAPI.generateQuestions(config)}
                            onApprove={addToDraft}
                            lockedSubject={selectedClass.subject}
                            lockedExamType={selectedClass.examType}
                            hideBankNotice
                          />
                        )}
                        {activeTool === 'pdf' && (
                          <PDFExtractorPanel
                            onExtract={(data) => teacherAPI.extractFromPDF(data)}
                            onApprove={addToDraft}
                            lockedSubject={selectedClass.subject}
                            lockedExamType={selectedClass.examType}
                            hideQuestionSource
                          />
                        )}
                        {activeTool === 'manual' && (
                          <ManualQuestionForm
                            subject={selectedClass.subject}
                            examType={selectedClass.examType}
                            showQuestionSource={false}
                            submitLabel="Add to assignment"
                            onAdd={(q) => addToDraft([q])}
                          />
                        )}
                      </div>
                    )}

                    {/* Draft summary */}
                    {draftQuestions.length > 0 && (
                      <div className="card">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
                            Assignment draft — {draftQuestions.length} question{draftQuestions.length !== 1 ? 's' : ''}
                          </h3>
                          <span className="badge-blue text-xs">{totalMarks} marks total</span>
                        </div>
                        <div className="space-y-2">
                          {draftQuestions.map((q, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="badge-gray text-xs flex-shrink-0">{q.type}</span>
                                <span className="text-sm text-slate-700 truncate">{q.questionText}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-slate-400">{q.marks}m</span>
                                <button onClick={() => removeFromDraft(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleCreateAssignment}
                          disabled={creatingAssignment}
                          className="btn-primary w-full py-3 mt-4"
                        >
                          {creatingAssignment
                            ? <><span className="spinner border-white/40 border-t-white" /> Creating…</>
                            : <>Create & assign to {selectedClass.studentCount} student{selectedClass.studentCount !== 1 ? 's' : ''} <ArrowRight className="w-4 h-4" /></>
                          }
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Review Submissions tab ─────────────────────────── */}
        {tab === 'review' && (
          reviewingId ? (
            <SubmissionReviewPanel
              submissionId={reviewingId}
              onBack={() => setReviewingId(null)}
              onPublished={() => { setReviewingId(null); loadPendingReviews() }}
            />
          ) : (
            <div className="space-y-3 animate-fade-in">
              {reviewsLoading && <p className="text-sm text-slate-400 text-center py-10">Loading…</p>}
              {!reviewsLoading && pendingReviews.length === 0 && (
                <div className="card text-center py-14 border-dashed border-2 border-slate-200">
                  <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Nothing awaiting review.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Submissions land here only when a student photographs an answer instead of typing it.
                  </p>
                </div>
              )}
              {pendingReviews.map(r => (
                <button
                  key={r.submissionId}
                  onClick={() => setReviewingId(r.submissionId)}
                  className="card w-full flex items-center justify-between gap-3 text-left hover:border-blue-300 border-2 border-transparent transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                      <p className="text-xs text-slate-400">{r.studentName} · {r.subject}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-GB') : ''}
                  </span>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </TeacherShell>
  )
}
