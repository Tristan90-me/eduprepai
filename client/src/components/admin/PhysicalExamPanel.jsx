import { useState, useRef } from 'react'
import { adminAPI } from '../../api/admin.api'
import toast from 'react-hot-toast'
import {
  Users, FileText, Camera, Check, ChevronRight,
  Upload, AlertTriangle,
} from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D']

// ── PhysicalExamPanel ──────────────────────────────────────────
// Admin tool for entering physical exam results.
// Three sub-steps: select student → enter answers → confirm & mark.
export default function PhysicalExamPanel() {
  const [step,      setStep]      = useState(1)  // 1=student, 2=answers, 3=confirm
  const [students,  setStudents]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [student,   setStudent]   = useState(null)
  const [exams,     setExams]     = useState([])
  const [exam,      setExam]      = useState(null)
  const [results,   setResults]   = useState(null)

  // ── Answers ────────────────────────────────────────────────
  // Sizes are set from the selected exam's real structure in
  // handleSelectExam — these defaults only cover the brief window
  // before an exam is chosen.
  const [answersA,     setAnswersA]     = useState([])
  const [answersB,     setAnswersB]     = useState([])
  const [selectedCIdx, setSelectedCIdx] = useState([])   // indices into exam.sectionC
  const [answersC,     setAnswersC]     = useState({})   // { [index]: text }
  const [activeSection, setActiveSection] = useState('A')

  // ── Photo upload state ─────────────────────────────────────
  const [extracting,   setExtracting]   = useState(false)
  const fileRef = useRef(null)

  // ── Load students ──────────────────────────────────────────
  const loadStudents = async () => {
    if (students.length > 0) return
    setLoading(true)
    try {
      const data = await adminAPI.getStudents()
      setStudents(data.students || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Select student ─────────────────────────────────────────
  const handleSelectStudent = async (s) => {
    setStudent(s)
    setLoading(true)
    try {
      const data = await adminAPI.getStudentExams(s._id)
      setExams(data.exams || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Select exam ────────────────────────────────────────────
  const handleSelectExam = (e) => {
    setExam(e)
    setAnswersA(Array(e.sectionA?.length || 0).fill(''))
    setAnswersB(Array(e.sectionB?.length || 0).fill(''))
    setSelectedCIdx([])
    setAnswersC({})
    // Reset to Section A — some subjects have no Section B at all (e.g.
    // BECE Mathematics), so a previously-active 'B' tab could otherwise
    // be stuck open with nothing in it.
    setActiveSection('A')
    setStep(2)
  }

  // ── Photo extraction ───────────────────────────────────────
  const handlePhotoUpload = async (e, section, idx) => {
    const file = e.target.files[0]
    if (!file) return

    setExtracting(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise((res, rej) => {
        reader.onload  = () => res(reader.result.split(',')[1])
        reader.onerror = () => rej(new Error('Failed to read photo'))
        reader.readAsDataURL(file)
      })

      const data = await adminAPI.extractFromPhoto({
        imageBase64:   base64,
        section,
        subject:       exam?.subject,
        questionCount: section === 'A' ? answersA.length : 1,
      })

      if (section === 'A' && data.extracted?.answers) {
        setAnswersA(data.extracted.answers)
        toast.success('MCQ answers extracted — please review each one')
      } else if (section === 'B' && data.extracted?.answer) {
        const updated = [...answersB]
        updated[idx] = data.extracted.answer
        setAnswersB(updated)
        toast.success('Section B answer extracted — please review')
      } else if (section === 'C' && data.extracted?.answer) {
        setAnswersC(prev => ({ ...prev, [idx]: data.extracted.answer }))
        toast.success('Essay extracted — please review')
      }
    } catch (err) {
      toast.error('Photo extraction failed: ' + err.message)
    } finally {
      setExtracting(false)
    }
  }

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Same index-aligned shape the online mock-exam flow already submits
      // (mockExam.controller.js's submitExam) — '' for anything not selected.
      const sectionCAnswers = (exam.sectionC || []).map((_, i) => answersC[i] || '')

      const data = await adminAPI.submitPhysicalExam({
        examId:          exam._id,
        studentId:       student._id,
        sectionAAnswers: answersA,
        sectionBAnswers: answersB,
        sectionCAnswers,
      })
      setResults(data)
      setStep(3)
      toast.success(data.message)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Answered counts ────────────────────────────────────────
  const aCount = answersA.filter(Boolean).length
  const bCount = answersB.filter(a => a.trim()).length
  const sectionCCap = exam?.sectionCAnswerCount || 1
  const cCount = selectedCIdx.filter(i => (answersC[i] || '').trim()).length
  // A subject with no real Section B at all (e.g. BECE Mathematics) has
  // its actual WAEC "Section B" living in this app's sectionC bucket —
  // label it "Section B" for the admin instead of the internal "C".
  const sectionCLabel = answersB.length === 0 ? 'B' : 'C'

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
            Physical Exam Results Entry
          </h3>
          <p className="text-sm text-slate-500">
            Enter results from a printed exam booklet on behalf of a student
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {['Select student', 'Enter answers', 'Results'].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
              i + 1 < step   ? 'bg-teal-500 text-white'
              : i + 1 === step ? 'bg-teal-600 text-white ring-4 ring-teal-100'
              : 'bg-slate-100 text-slate-400'
            }`}>
              {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i + 1 === step ? 'text-teal-700' : 'text-slate-400'}`}>
              {label}
            </span>
            {i < 2 && <div className={`flex-1 h-px ${step > i + 1 ? 'bg-teal-400' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Student + Exam selection ─────────────── */}
      {step === 1 && (
        <div className="card space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-800">Select student</h4>
            <button
              onClick={loadStudents}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              {loading ? <span className="spinner" /> : <Users className="w-4 h-4" />}
              {students.length === 0 ? 'Load students' : `${students.length} students`}
            </button>
          </div>

          {students.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {students.map(s => (
                <button
                  key={s._id}
                  onClick={() => handleSelectStudent(s)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                    student?._id === s._id
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-slate-200 hover:border-teal-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.fullName}</p>
                    <p className="text-xs text-slate-400">{s.school || 'No school'} · {s.examType}</p>
                  </div>
                  {student?._id === s._id && <Check className="w-4 h-4 text-teal-500" />}
                </button>
              ))}
            </div>
          )}

          {student && exams.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-800 mb-2">Select exam paper</h4>
              <div className="space-y-1.5">
                {exams.map(e => (
                  <button
                    key={e._id}
                    onClick={() => handleSelectExam(e)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 border-slate-200 hover:border-teal-300 text-left transition-all"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{e.subject}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(e.createdAt).toLocaleDateString('en-GB')} · {e.status}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {student && exams.length === 0 && !loading && (
            <div className="text-center py-6 text-slate-400 text-sm">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              No generated exams found for this student.
              Generate a mock exam for them first.
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Answer entry ───────────────────────────── */}
      {step === 2 && exam && (
        <div className="space-y-4 animate-fade-in">

          {/* Student + exam info */}
          <div className="card bg-teal-50 border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-teal-900 text-sm">{student?.fullName}</p>
                <p className="text-xs text-teal-600">{exam.subject} · {exam.examType}</p>
              </div>
              <button onClick={() => setStep(1)} className="btn-secondary text-xs py-1.5">
                Change
              </button>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { key: 'A', label: `Section A (${aCount}/${answersA.length})` },
              { key: 'B', label: `Section B (${bCount}/${answersB.length})` },
              { key: 'C', label: `Section ${sectionCLabel} (${cCount}/${sectionCCap})` },
            ]
              // Some subjects have no Section B at all (e.g. BECE Mathematics)
              .filter(({ key }) => key !== 'B' || answersB.length > 0)
              .map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === key
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Section A — MCQ grid */}
          {activeSection === 'A' && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-800 text-sm">
                  Section A — Click the student's answer for each question
                </h4>
                <label className="btn-secondary text-xs py-1.5 cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  {extracting ? 'Extracting…' : 'Upload photo'}
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={e => handlePhotoUpload(e, 'A')}
                    disabled={extracting}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {answersA.map((ans, idx) => (
                  <div key={idx} className={`rounded-xl border-2 p-2 ${ans ? 'border-teal-300 bg-teal-50' : 'border-slate-200'}`}>
                    <p className="text-xs text-slate-400 mb-1.5 font-medium">Q{idx + 1}</p>
                    <div className="flex gap-1">
                      {LETTERS.map(l => (
                        <button
                          key={l}
                          onClick={() => {
                            const updated = [...answersA]
                            updated[idx] = updated[idx] === l ? '' : l
                            setAnswersA(updated)
                          }}
                          className={`flex-1 py-1 rounded text-xs font-bold transition-colors ${
                            ans === l
                              ? 'bg-teal-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-500 hover:border-teal-300'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section B — typed answers */}
          {activeSection === 'B' && (
            <div className="card space-y-4">
              <h4 className="font-medium text-slate-800 text-sm">
                Section B — Type or paste the student's written answers
              </h4>
              {answersB.map((_, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">Question {idx + 1} answer</label>
                    <label className="btn-secondary text-xs py-1 cursor-pointer">
                      <Camera className="w-3 h-3" />
                      Photo
                      <input
                        type="file" accept="image/*" className="hidden"
                        onChange={e => handlePhotoUpload(e, 'B', idx)}
                        disabled={extracting}
                      />
                    </label>
                  </div>
                  <textarea
                    value={answersB[idx]}
                    onChange={e => {
                      const updated = [...answersB]
                      updated[idx] = e.target.value
                      setAnswersB(updated)
                    }}
                    rows={4}
                    placeholder="Type the student's answer here, or upload a photo to extract..."
                    className="input resize-none text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Section C — essay(s). Capped multi-select, same model as the
             online exam's ExamSectionC.jsx — most subjects answer 1 of 2,
             but e.g. BECE Computing answers 3 of 4. */}
          {activeSection === 'C' && (
            <div className="card space-y-4">
              <h4 className="font-medium text-slate-800 text-sm">
                Section {sectionCLabel} — Select {sectionCCap > 1 ? `up to ${sectionCCap} questions` : 'which question'} and enter the essay{sectionCCap > 1 ? 's' : ''}
              </h4>

              <div className="flex flex-wrap gap-2">
                {(exam.sectionC || []).map((_, idx) => {
                  const isSelected = selectedCIdx.includes(idx)
                  const atCap = selectedCIdx.length >= sectionCCap
                  return (
                    <button
                      key={idx}
                      disabled={!isSelected && atCap}
                      onClick={() => setSelectedCIdx(prev =>
                        isSelected ? prev.filter(i => i !== idx) : [...prev, idx]
                      )}
                      className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600'
                          : !isSelected && atCap
                          ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      Question {idx + 1}
                    </button>
                  )
                })}
              </div>

              {selectedCIdx.map(idx => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">Essay answer (Question {idx + 1})</label>
                    <label className="btn-secondary text-xs py-1 cursor-pointer">
                      <Camera className="w-3 h-3" />
                      Photo
                      <input
                        type="file" accept="image/*" className="hidden"
                        onChange={e => handlePhotoUpload(e, 'C', idx)}
                        disabled={extracting}
                      />
                    </label>
                  </div>
                  <textarea
                    value={answersC[idx] || ''}
                    onChange={e => setAnswersC(prev => ({ ...prev, [idx]: e.target.value }))}
                    rows={10}
                    placeholder="Type or paste the student's essay here..."
                    className="input resize-none text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || aCount === 0}
              className="btn-primary flex-1 py-3"
            >
              {loading
                ? <><span className="spinner border-white/40 border-t-white" /> Marking…</>
                : 'Submit & mark paper'
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Results ────────────────────────────────── */}
      {step === 3 && results && (
        <div className="card animate-fade-in">
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              Paper marked successfully
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Results have been saved to {student?.fullName}'s account
            </p>

            <div className="inline-flex items-center gap-3 bg-teal-50 border-2 border-teal-300 rounded-2xl px-8 py-4">
              <span className="text-4xl font-bold text-teal-700" style={{ fontFamily: 'var(--font-heading)' }}>
                {results.results?.waecGrade}
              </span>
              <div className="text-left">
                <p className="font-semibold text-teal-800">
                  {results.results?.totalMarks}/{results.results?.availableMarks} marks
                </p>
                <p className="text-teal-600 text-sm">{results.results?.gradeLabel}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setStep(1); setStudent(null); setExam(null); setResults(null) }}
            className="btn-secondary w-full mt-4"
          >
            Enter another student's results
          </button>
        </div>
      )}
    </div>
  )
}