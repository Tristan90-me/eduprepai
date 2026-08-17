import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth }          from '../../context/AuthContext'
import { mockExamAPI }      from '../../api/mockExam.api'
import AppShell             from '../../components/layout/AppShell'
import ExamCoverPage        from '../../components/exam/ExamCoverPage'
import ExamTimer            from '../../components/exam/ExamTimer'
import ExamSectionA         from '../../components/exam/ExamSectionA'
import ExamSectionB         from '../../components/exam/ExamSectionB'
import ExamSectionC         from '../../components/exam/ExamSectionC'
import ExamResultCard       from '../../components/exam/ExamResultCard'
import { BookOpen, ChevronRight, Send, AlertTriangle, History } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubjectsForExamType } from '../../constants/subjects'

// ── MockExamPage ───────────────────────────────────────────────
// Four internal screens:
// 'setup'    → subject selection + exam history
// 'cover'    → formal WAEC cover page
// 'exam'     → active timed exam (sections A, B, C)
// 'results'  → marked results + examiner feedback
export default function MockExamPage() {
  const { user } = useAuth()

  // ── Screen state ───────────────────────────────────────────
  const [screen, setScreen] = useState('setup')

  // ── Setup ──────────────────────────────────────────────────
  // Mock exams are locked to the student's registered exam type — a
  // WASSCE student can only generate WASSCE papers and vice versa.
  const examType = user?.examType || 'WASSCE'
  const [subject,    setSubject]    = useState(user?.subjects?.[0] || getSubjectsForExamType(examType)[0])
  const [pastExams,  setPastExams]  = useState([])
  const [generating, setGenerating] = useState(false)

  // ── Exam state ─────────────────────────────────────────────
  const [exam,           setExam]           = useState(null)
  const [activeSection,  setActiveSection]  = useState('A')
  const [isStarting,     setIsStarting]     = useState(false)
  const [isSubmitting,   setIsSubmitting]   = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  // ── Answers — stored locally, auto-saved to server ─────────
  const [answersA, setAnswersA] = useState({})   // { questionIndex: 'A'|'B'|'C'|'D' }
  const [answersB, setAnswersB] = useState({})   // { questionIndex: 'text...' }
  const [answerCIdx, setAnswerCIdx] = useState(null)  // which essay chosen
  const [answerC,    setAnswerC]    = useState('')    // essay text

  // ── Results ─────────────────────────────────────────────────
  const [results, setResults] = useState(null)
  const [markedExam, setMarkedExam] = useState(null)

  const autoSaveRef = useRef(null)

  // ── Load past exams ────────────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await mockExamAPI.getMyExams({ subject })
        setPastExams(data.exams || [])
      } catch { setPastExams([]) }
    }
    loadHistory()
  }, [subject])

  // ── Generate exam ──────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const data = await mockExamAPI.generate({ subject, examType })
      setExam(data.exam)
      // Reset answers
      setAnswersA({})
      setAnswersB({})
      setAnswerCIdx(null)
      setAnswerC('')
      setScreen('cover')

      if (data.resumed) {
        toast('Resuming your previous exam session', { icon: '📋' })
        // Pre-fill saved answers
        data.exam.sectionA.forEach((q, i) => {
          if (q.studentAnswer) setAnswersA(p => ({ ...p, [i]: q.studentAnswer }))
        })
        data.exam.sectionB.forEach((q, i) => {
          if (q.studentAnswer) setAnswersB(p => ({ ...p, [i]: q.studentAnswer }))
        })
        data.exam.sectionC.forEach((q, i) => {
          if (q.studentAnswer) { setAnswerCIdx(i); setAnswerC(q.studentAnswer) }
        })
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // ── Start exam ─────────────────────────────────────────────
  const handleStart = async () => {
    setIsStarting(true)
    try {
      await mockExamAPI.start(exam._id)
      const data = await mockExamAPI.getExam(exam._id)
      setExam(data.exam)
      setScreen('exam')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsStarting(false)
    }
  }

  // ── Auto-save MCQ answer ───────────────────────────────────
  const handleAnswerA = useCallback(async (idx, letter) => {
    setAnswersA(prev => ({ ...prev, [idx]: letter }))
    try {
      await mockExamAPI.saveAnswer(exam._id, {
        section:       'sectionA',
        questionIndex: idx,
        studentAnswer: letter,
      })
    } catch { /* silent fail — answer stored locally */ }
  }, [exam?._id])

  // ── Auto-save typed answer with debounce ───────────────────
  const handleAnswerB = useCallback((idx, text) => {
    setAnswersB(prev => ({ ...prev, [idx]: text }))
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(async () => {
      try {
        await mockExamAPI.saveAnswer(exam._id, {
          section:       'sectionB',
          questionIndex: idx,
          studentAnswer: text,
        })
      } catch { /* silent */ }
    }, 1500)
  }, [exam?._id])

  const handleAnswerC = useCallback((text) => {
    setAnswerC(text)
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(async () => {
      if (answerCIdx !== null) {
        try {
          await mockExamAPI.saveAnswer(exam._id, {
            section:       'sectionC',
            questionIndex: answerCIdx,
            studentAnswer: text,
          })
        } catch { /* silent */ }
      }
    }, 1500)
  }, [exam?._id, answerCIdx])

  // ── Submit paper ───────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setShowSubmitConfirm(false)
    toast.loading('Marking your paper… this may take a minute', { id: 'marking' })

    try {
      // Build final answer arrays
      const sectionAAnswers = exam.sectionA.map((_, i) => answersA[i] || '')
      const sectionBAnswers = exam.sectionB.map((_, i) => answersB[i] || '')
      const sectionCAnswers = exam.sectionC.map((_, i) =>
        i === answerCIdx ? answerC : ''
      )

      const timeSpent = exam.startedAt
        ? Math.round((Date.now() - new Date(exam.startedAt).getTime()) / 1000)
        : 0

      const data = await mockExamAPI.submit(exam._id, {
        answers: {
          sectionA: sectionAAnswers,
          sectionB: sectionBAnswers,
          sectionC: sectionCAnswers,
        },
        timeSpentSeconds: timeSpent,
      })

      toast.success('Paper marked!', { id: 'marking' })

      // Reload full exam to get marked version
      const markedData = await mockExamAPI.getExam(exam._id)
      setMarkedExam(markedData.exam)
      setResults(data.results)
      setScreen('results')
    } catch (err) {
      toast.error(err.message, { id: 'marking' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Answer counts for submit confirmation ──────────────────
  const aAnswered = Object.values(answersA).filter(Boolean).length
  const bAnswered = Object.values(answersB).filter(a => a?.trim()).length
  const cAnswered = answerC.trim().length > 0 ? 1 : 0

  // ── Completeness summary ───────────────────────────────────
  const totalAnswered = aAnswered + bAnswered + cAnswered
  const totalQuestions = (exam?.sectionA?.length || 0) + (exam?.sectionB?.length || 0) + 1

  // ─────────────────────────────────────────────────────────────
  return (
    <AppShell
      title="Mock Examination"
      subtitle={
        screen === 'exam'
          ? `${subject} — ${examType} Practice Paper`
          : screen === 'results'
          ? 'Examination results'
          : 'WAEC-standard practice paper'
      }
    >
      <div className="max-w-5xl mx-auto">

        {/* ══════════════ SETUP SCREEN ═══════════════════════ */}
        {screen === 'setup' && (
          <div className="space-y-6 animate-fade-in">

            {/* Subject selection */}
            <div className="card">
              <h2 className="section-title flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Select examination subject
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {(user?.subjects?.length > 0 ? user.subjects : getSubjectsForExamType(examType)).map(s => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 text-left transition-all ${
                      subject === s
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-5 text-xs text-slate-500">
                <span className="badge-teal">{examType}</span>
                Generated for your registered exam type
              </div>

              {/* What to expect */}
              <div className="bg-slate-50 rounded-xl p-4 mb-5">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  What you'll get
                </p>
                <div className="grid grid-cols-3 gap-3 text-xs text-slate-600">
                  {[
                    { label: 'Section A', detail: '40 MCQ questions' },
                    { label: 'Section B', detail: '4 structured questions' },
                    { label: 'Section C', detail: '1 essay (choose from 2)' },
                  ].map(({ label, detail }) => (
                    <div key={label} className="text-center">
                      <p className="font-semibold text-slate-800">{label}</p>
                      <p className="text-slate-500 mt-0.5">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary w-full py-4 text-base"
              >
                {generating
                  ? <><span className="spinner border-white/40 border-t-white" /> Generating your paper…</>
                  : <>Generate {examType} {subject} paper <ChevronRight className="w-5 h-5" /></>
                }
              </button>
            </div>

            {/* Past exams */}
            {pastExams.length > 0 && (
              <div className="card">
                <h2 className="section-title flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-600" />
                  Previous attempts
                </h2>
                <div className="space-y-2.5">
                  {pastExams.slice(0, 5).map(e => (
                    <div key={e._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{e.subject}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(e.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                          {' · '}
                          <span className={`font-medium ${
                            e.status === 'marked' ? 'text-teal-600' :
                            e.status === 'in_progress' ? 'text-amber-600' : 'text-slate-400'
                          }`}>
                            {e.status === 'marked'
                              ? `${e.results?.waecGrade} — ${e.results?.totalMarks}/100`
                              : e.status === 'in_progress'
                              ? 'In progress'
                              : 'Generated'
                            }
                          </span>
                        </p>
                      </div>
                      {e.status === 'marked' && (
                        <span className={`badge-${['A1','B2','B3'].includes(e.results?.waecGrade) ? 'green' : ['C4','C5','C6'].includes(e.results?.waecGrade) ? 'teal' : 'red'}`}>
                          {e.results?.waecGrade}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ COVER SCREEN ════════════════════════ */}
        {screen === 'cover' && exam && (
          <ExamCoverPage
            exam={exam}
            onStart={handleStart}
            isStarting={isStarting}
          />
        )}

        {/* ══════════════ EXAM SCREEN ═════════════════════════ */}
        {screen === 'exam' && exam && (
          <div className="space-y-5">

            {/* Sticky exam toolbar */}
            <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 flex-wrap">

              {/* Section tabs */}
              <div className="flex gap-1 flex-1">
                {[
                  { key: 'A', label: 'Section A', count: aAnswered, total: exam.sectionA.length },
                  { key: 'B', label: 'Section B', count: bAnswered, total: exam.sectionB.length },
                  { key: 'C', label: 'Section C', count: cAnswered, total: 1 },
                ].map(({ key, label, count, total }) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`flex-1 flex flex-col items-center py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                      activeSection === key
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-xs mt-0.5 ${activeSection === key ? 'text-teal-200' : 'text-slate-400'}`}>
                      {count}/{total}
                    </span>
                  </button>
                ))}
              </div>

              {/* Timer */}
              <ExamTimer
                totalMinutes={exam.timeAllowedMinutes}
                startedAt={exam.startedAt}
                onTimeUp={() => {
                  toast('Time is up! Submitting your paper…', { icon: '⏰' })
                  handleSubmit()
                }}
              />

              {/* Submit button */}
              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSubmitting}
                className="btn-accent py-2 text-sm flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Submit
              </button>
            </div>

            {/* Submit confirmation banner */}
            {showSubmitConfirm && (
              <div className="card border-2 border-amber-300 bg-amber-50 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 text-sm">
                      Submit your paper?
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      You have answered {aAnswered}/{exam.sectionA.length} MCQ,{' '}
                      {bAnswered}/{exam.sectionB.length} structured, and{' '}
                      {cAnswered}/1 essay question.
                      This cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowSubmitConfirm(false)}
                      className="btn-secondary text-sm py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="btn-accent text-sm py-1.5"
                    >
                      {isSubmitting ? <span className="spinner border-white/40 border-t-white" /> : 'Confirm submit'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active section content */}
            {activeSection === 'A' && (
              <ExamSectionA
                questions={exam.sectionA}
                answers={answersA}
                onAnswer={handleAnswerA}
              />
            )}

            {activeSection === 'B' && (
              <ExamSectionB
                questions={exam.sectionB}
                answers={answersB}
                onAnswer={handleAnswerB}
              />
            )}

            {activeSection === 'C' && (
              <ExamSectionC
                questions={exam.sectionC}
                selectedQuestion={answerCIdx}
                answer={answerC}
                onSelectQuestion={setAnswerCIdx}
                onAnswer={handleAnswerC}
              />
            )}

            {/* Bottom submit */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSubmitting}
                className="btn-accent py-3 px-6"
              >
                <Send className="w-4 h-4" />
                Submit paper for marking
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ RESULTS SCREEN ══════════════════════ */}
        {screen === 'results' && results && (
          <>
            {/* Review tabs appear above results */}
            <div className="flex gap-2 mb-5">
              {['Results', 'Review A', 'Review B', 'Review C'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveSection(i === 0 ? 'results' : ['A', 'B', 'C'][i - 1])}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    (i === 0 && activeSection === 'results') ||
                    (i > 0 && activeSection === ['A', 'B', 'C'][i - 1])
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeSection === 'results' && (
              <ExamResultCard
                results={results}
                subject={subject}
                examType={examType}
                onRetake={() => setScreen('setup')}
              />
            )}

            {activeSection === 'A' && markedExam && (
              <ExamSectionA
                questions={markedExam.sectionA}
                answers={answersA}
                onAnswer={() => {}}
                isReview
                markedQuestions={markedExam.sectionA}
              />
            )}

            {activeSection === 'B' && markedExam && (
              <ExamSectionB
                questions={markedExam.sectionB}
                answers={answersB}
                onAnswer={() => {}}
                isReview
                markedQuestions={markedExam.sectionB}
              />
            )}

            {activeSection === 'C' && markedExam && (
              <ExamSectionC
                questions={markedExam.sectionC}
                selectedQuestion={answerCIdx}
                answer={answerC}
                onSelectQuestion={() => {}}
                onAnswer={() => {}}
                isReview
                markedQuestions={markedExam.sectionC}
              />
            )}
          </>
        )}

      </div>
    </AppShell>
  )
}