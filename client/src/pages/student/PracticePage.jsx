import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth }          from '../../context/AuthContext'
import { practiceAPI }      from '../../api/practice.api'
import AppShell             from '../../components/layout/AppShell'
import QuestionCard         from '../../components/QuestionCard'
import ExplanationPanel     from '../../components/ExplanationPanel'
import SessionSummary       from '../../components/SessionSummary'
import MasteryBadge         from '../../components/MasteryBadge'
import { calculateWAECGrade } from '../../utils/gradeUtils'
import {
  BookOpen, ChevronRight, Shuffle,
  Target, X, Settings,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubjectsForExamType } from '../../constants/subjects'

// ── PracticePage has 3 internal states ────────────────────────
// 'setup'   → student configures the session
// 'session' → actively answering questions
// 'done'    → session complete, summary shown
export default function PracticePage() {
  const { user } = useAuth()

  // ── Screen state ───────────────────────────────────────────
  const [screen, setScreen] = useState('setup')

  // ── Setup state ────────────────────────────────────────────
  // examType is locked to the student's registered exam type — a
  // WASSCE student never sees or can request BECE content and vice versa.
  const examType = user?.examType || 'WASSCE'
  const [subject,   setSubject]   = useState(user?.subjects?.[0] || getSubjectsForExamType(examType)[0])
  const [topic,     setTopic]     = useState('')
  const [qType,     setQType]     = useState('MCQ')
  const [qCount,    setQCount]    = useState(10)
  const [timed,     setTimed]     = useState(false)
  const [topics,    setTopics]    = useState([])
  const [topicsLoading, setTopicsLoading] = useState(false)

  // ── Session state ──────────────────────────────────────────
  const [questions,    setQuestions]    = useState([])
  const [currentIdx,   setCurrentIdx]   = useState(0)
  const [results,      setResults]      = useState([])   // one per question answered
  const [currentResult,setCurrentResult]= useState(null)
  const [explanation,  setExplanation]  = useState(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const [sessionStart, setSessionStart] = useState(null)
  const [masteryUpdates, setMasteryUpdates] = useState([])

  // ── Timer ──────────────────────────────────────────────────
  const [timerSeconds, setTimerSeconds] = useState(null)
  const timerRef = useRef(null)

  // ── Load topics when subject or exam type changes ──────────
  useEffect(() => {
    const loadTopics = async () => {
      setTopicsLoading(true)
      setTopic('')
      try {
        const data = await practiceAPI.getTopics({ subject, examType })
        setTopics(data.topics || [])
      } catch {
        setTopics([])
      } finally {
        setTopicsLoading(false)
      }
    }
    loadTopics()
  }, [subject, examType])

  // ── Start a session ────────────────────────────────────────
  const handleStart = async () => {
    try {
      const data = await practiceAPI.getQuestions({
        subject,
        examType,
        topic:  topic || undefined,
        type:   qType,
        limit:  qCount,
      })

      if (!data.questions?.length) {
        return toast.error('No questions found for this selection. Try different filters.')
      }

      setQuestions(data.questions)
      setCurrentIdx(0)
      setResults([])
      setCurrentResult(null)
      setExplanation(null)
      setMasteryUpdates([])
      setSessionStart(Date.now())

      // Start timer if timed mode
      if (timed) {
        const timePerQ = qType === 'Essay' ? 35 * 60 : qType === 'Structured' ? 15 * 60 : 90
        setTimerSeconds(timePerQ)
      }

      setScreen('session')
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ── Handle answer submission ───────────────────────────────
  const handleSubmit = useCallback(async (answer) => {
    // 'next' signal — move to next question
    if (answer === '__next__') {
      clearInterval(timerRef.current)
      setExplanation(null)
      setCurrentResult(null)

      if (currentIdx + 1 >= questions.length) {
        // Session complete
        await finishSession()
        return
      }

      setCurrentIdx(i => i + 1)

      // Reset timer for next question
      if (timed) {
        const q = questions[currentIdx + 1]
        const timePerQ = q?.type === 'Essay' ? 35 * 60 : q?.type === 'Structured' ? 15 * 60 : 90
        setTimerSeconds(timePerQ)
      }
      return
    }

    // Real answer — submit to server
    const question = questions[currentIdx]
    try {
      const data = await practiceAPI.submitAnswer({
        questionId:    question._id,
        studentAnswer: answer,
        timeTaken:     timed && timerSeconds !== null
          ? (question.type === 'Essay' ? 35 * 60 : 90) - timerSeconds
          : 0,
      })

      clearInterval(timerRef.current)

      const result = data.result
      setCurrentResult(result)

      // Track results and mastery updates
      setResults(prev => [...prev, { questionId: question._id, ...result }])
      if (result.masteryUpdate) {
        setMasteryUpdates(prev => {
          const idx = prev.findIndex(u => u.topic === result.masteryUpdate.topic)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx] = result.masteryUpdate
            return updated
          }
          return [...prev, result.masteryUpdate]
        })
      }
    } catch (err) {
      toast.error('Could not submit answer: ' + err.message)
    }
  }, [currentIdx, questions, timed, timerSeconds])

  // ── Timer countdown ────────────────────────────────────────
  useEffect(() => {
    if (timerSeconds === null || !timed || screen !== 'session') return
    if (timerSeconds <= 0) {
      handleSubmit(questions[currentIdx]?.type === 'MCQ' ? '' : 'Time expired')
      return
    }
    timerRef.current = setInterval(() => setTimerSeconds(s => s - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [timerSeconds, timed, screen])

  // ── Request AI explanation ─────────────────────────────────
  const handleExplain = async () => {
    const question = questions[currentIdx]
    if (!currentResult) return
    setIsExplaining(true)
    setExplanation(null)
    try {
      const data = await practiceAPI.getExplanation({
        questionId:    question._id,
        studentAnswer: currentResult.studentAnswer || '',
        isCorrect:     currentResult.isCorrect,
      })
      setExplanation(data.explanation)
    } catch (err) {
      toast.error('Could not load explanation: ' + err.message)
    } finally {
      setIsExplaining(false)
    }
  }

  // ── Finish session ─────────────────────────────────────────
  const finishSession = async () => {
    const totalMarks     = results.reduce((s, r) => s + (r.marksAwarded   || 0), 0)
    const availableMarks = results.reduce((s, r) => s + (r.marksAvailable || 0), 0)
    const duration       = Math.round((Date.now() - sessionStart) / 1000)
    const accuracy       = availableMarks > 0
      ? Math.round((totalMarks / availableMarks) * 100) : 0

    try {
      await practiceAPI.saveSession({
        subject, topic, examType,
        questions:     results,
        totalMarks,
        availableMarks,
        duration,
        masteryUpdates,
      })
    } catch {
      // Non-blocking — session still shows summary
    }

    setScreen('done')
  }

  // ── Restart ────────────────────────────────────────────────
  const handleRestart = () => {
    setScreen('setup')
    setQuestions([])
    setCurrentIdx(0)
    setResults([])
    setCurrentResult(null)
    setExplanation(null)
    setTimerSeconds(null)
    clearInterval(timerRef.current)
  }

  // ── Session totals for summary ─────────────────────────────
  const totalMarks     = results.reduce((s, r) => s + (r.marksAwarded   || 0), 0)
  const availableMarks = results.reduce((s, r) => s + (r.marksAvailable || 0), 0)
  const accuracy       = availableMarks > 0
    ? Math.round((totalMarks / availableMarks) * 100) : 0
  const duration       = sessionStart
    ? Math.round((Date.now() - sessionStart) / 1000) : 0

  // ─────────────────────────────────────────────────────────────
  return (
    <AppShell
      title="Practice Mode"
      subtitle={screen === 'session'
        ? `${subject} · Question ${currentIdx + 1} of ${questions.length}`
        : screen === 'done'
        ? 'Session complete'
        : 'Adaptive question practice'
      }
    >
      <div className="max-w-4xl mx-auto">

        {/* ══════════════ SETUP SCREEN ═══════════════════════ */}
        {screen === 'setup' && (
          <div className="space-y-6 animate-fade-in">

            {/* Subject + exam type */}
            <div className="card">
              <h2 className="section-title flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Choose your subject
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {(user?.subjects?.length > 0 ? user.subjects : getSubjectsForExamType(examType)).map(s => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                      subject === s
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="badge-teal">{examType}</span>
                Practising for your registered exam type
              </div>
            </div>

            {/* Topic picker with mastery indicators */}
            <div className="card">
              <h2 className="section-title flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                Choose a topic
                <span className="text-slate-400 font-normal text-sm ml-1">(optional — leave blank for mixed)</span>
              </h2>

              {topicsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                  <span className="spinner text-teal-500" /> Loading topics…
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">

                  {/* Mixed option */}
                  <button
                    onClick={() => setTopic('')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${
                      !topic
                        ? 'bg-teal-50 border-teal-400 text-teal-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shuffle className="w-4 h-4 text-teal-500" />
                      <span className="font-medium">Mixed topics</span>
                    </div>
                    <span className="text-xs text-slate-400">All topics</span>
                  </button>

                  {/* Individual topics */}
                  {topics.map(t => (
                    <button
                      key={t.topic}
                      onClick={() => setTopic(t.topic)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${
                        topic === t.topic
                          ? 'bg-teal-50 border-teal-400 text-teal-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-teal-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{t.topic}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {t.count} Qs
                        </span>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <MasteryBadge score={t.score} size="sm" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Session options */}
            <div className="card">
              <h2 className="section-title flex items-center gap-2">
                <Settings className="w-4 h-4 text-teal-600" />
                Session options
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Question type */}
                <div>
                  <label className="label">Question type</label>
                  <div className="flex flex-col gap-1.5">
                    {['MCQ', 'Structured', 'Essay'].map(t => (
                      <button
                        key={t}
                        onClick={() => setQType(t)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border-2 text-left transition-all ${
                          qType === t
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of questions */}
                <div>
                  <label className="label">Number of questions</label>
                  <div className="flex flex-col gap-1.5">
                    {[5, 10, 20, 40].map(n => (
                      <button
                        key={n}
                        onClick={() => setQCount(n)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border-2 text-left transition-all ${
                          qCount === n
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        {n} questions
                        {n === 40 && <span className="text-xs opacity-70 ml-1">(full section)</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timed mode */}
                <div>
                  <label className="label">Mode</label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { value: false, label: 'Relaxed', desc: 'No time pressure' },
                      { value: true,  label: 'Timed',   desc: 'WAEC time limits'  },
                    ].map(({ value, label, desc }) => (
                      <button
                        key={label}
                        onClick={() => setTimed(value)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border-2 text-left transition-all ${
                          timed === value
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        {label}
                        <p className="text-xs mt-0.5 opacity-70">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              className="btn-primary w-full py-4 text-base"
            >
              Start practice session
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ══════════════ SESSION SCREEN ══════════════════════ */}
        {screen === 'session' && questions[currentIdx] && (
          <div className="space-y-4">

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 progress-bar">
                <div
                  className="progress-fill bg-teal-500"
                  style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 flex-shrink-0">
                {currentIdx + 1}/{questions.length}
              </span>
              <button
                onClick={handleRestart}
                className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                aria-label="Exit session"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Question card */}
            <QuestionCard
              question={questions[currentIdx]}
              questionNumber={currentIdx + 1}
              totalQuestions={questions.length}
              onSubmit={handleSubmit}
              result={currentResult}
              onExplain={handleExplain}
              isExplaining={isExplaining}
              timerSeconds={timed ? timerSeconds : undefined}
            />

            {/* Explanation panel — shown below question card */}
            {(explanation || isExplaining) && (
              <ExplanationPanel
                explanation={explanation}
                onClose={() => setExplanation(null)}
              />
            )}
          </div>
        )}

        {/* ══════════════ DONE SCREEN ═════════════════════════ */}
        {screen === 'done' && (
          <SessionSummary
            subject={subject}
            topic={topic}
            totalMarks={totalMarks}
            availableMarks={availableMarks}
            accuracy={accuracy}
            duration={duration}
            grade={availableMarks > 0 ? calculateWAECGrade(totalMarks, availableMarks) : null}
            masteryUpdates={masteryUpdates}
            onPracticeAgain={handleRestart}
          />
        )}

      </div>
    </AppShell>
  )
}