import { useState } from 'react'
import { mockExamAPI } from '../../api/mockExam.api'
import ExamResultCard   from './ExamResultCard'
import ExamSectionA     from './ExamSectionA'
import ExamSectionB     from './ExamSectionB'
import ExamSectionC     from './ExamSectionC'
import ExplanationPanel from '../ExplanationPanel'
import toast from 'react-hot-toast'

// ── MockExamReview ───────────────────────────────────────────────
// Full review of a marked exam — the results summary plus a tabbed,
// read-only walkthrough of every section, with an "Explain" option
// per question. Used both right after submission (MockExamPage) and
// when loading any past exam by ID (MockExamReviewPage), since the
// exam document already carries everything needed: questions, the
// student's own answers, marking, and feedback.
export default function MockExamReview({ exam, onRetake }) {
  const [activeSection, setActiveSection] = useState('results')
  const [explainOpen,   setExplainOpen]   = useState(null) // { section: 'A'|'B'|'C', index }
  const [explaining,    setExplaining]    = useState(false)
  const [explanations,  setExplanations]  = useState({})   // `${section}-${index}` -> explanation

  const { results, subject, examType } = exam

  // A loaded-by-ID review has no live editing state — each question's
  // own studentAnswer field already IS the answer, so derive rather
  // than duplicate it into separate state.
  const answersA = Object.fromEntries(exam.sectionA.map((q, i) => [i, q.studentAnswer || '']))
  const answersB = Object.fromEntries(exam.sectionB.map((q, i) => [i, q.studentAnswer || '']))
  const answerCIndices = exam.sectionC
    .map((q, i) => (q.studentAnswer?.trim() ? i : null))
    .filter(i => i !== null)
  const answersC = Object.fromEntries(exam.sectionC.map((q, i) => [i, q.studentAnswer || '']))

  // A subject with no real Section B at all (e.g. BECE Mathematics) has
  // its actual WAEC "Section B" living in this app's sectionC bucket —
  // label it "Section B" for the student instead of the internal "C".
  const sectionCLabel = exam.sectionB.length === 0 ? 'B' : 'C'

  const key = (sectionLetter, index) => `${sectionLetter}-${index}`

  const handleExplain = async (sectionLetter, index) => {
    const k = key(sectionLetter, index)

    // Already have it, or a request is already in flight — guard
    // against double-clicks / rapid clicks on different questions
    // firing concurrent requests (the backend also protects against
    // this, but avoiding the duplicate call entirely is cheaper).
    if (explanations[k]) { setExplainOpen({ section: sectionLetter, index }); return }
    if (explaining) return

    setExplainOpen({ section: sectionLetter, index })

    const fieldName = `section${sectionLetter}`
    const question  = exam[fieldName][index]

    // Already generated in an earlier session — the exam document
    // carries its own cache, no need to call the API at all.
    if (question.aiExplanation) {
      setExplanations(p => ({ ...p, [k]: question.aiExplanation }))
      return
    }

    setExplaining(true)
    try {
      const data = await mockExamAPI.explain(exam._id, { section: fieldName, index })
      setExplanations(p => ({ ...p, [k]: data.explanation }))
    } catch (err) {
      toast.error(err.message)
      setExplainOpen(null)
    } finally {
      setExplaining(false)
    }
  }

  const closeExplain = () => setExplainOpen(null)

  // Rendered inline after whichever section is active — nothing shows
  // for a section that isn't both active and has an open explanation.
  const renderExplainArea = (sectionLetter) => {
    if (explainOpen?.section !== sectionLetter) return null
    const current = explanations[key(sectionLetter, explainOpen.index)]

    if (!current && explaining) {
      return (
        <div className="max-w-3xl mx-auto mt-4 flex items-center gap-2 text-sm text-slate-500 animate-fade-in">
          <span className="spinner text-teal-600" /> Generating explanation…
        </div>
      )
    }

    return <ExplanationPanel explanation={current} onClose={closeExplain} />
  }

  return (
    <>
      {/* Review tabs appear above results. Built from explicit
         {label, key} pairs rather than a fixed positional array — a
         subject can genuinely have no Section B at all (e.g. BECE
         Mathematics), and skipping it here needs to not throw off
         which section each remaining tab activates. */}
      <div className="flex gap-2 mb-5">
        {[
          { label: 'Results',   key: 'results' },
          { label: 'Review A',  key: 'A' },
          ...(exam.sectionB.length > 0 ? [{ label: 'Review B', key: 'B' }] : []),
          { label: `Review ${sectionCLabel}`,  key: 'C' },
        ].map(({ label, key }) => (
          <button
            key={key}
            onClick={() => { setActiveSection(key); setExplainOpen(null) }}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
              activeSection === key
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeSection === 'results' && (
        <ExamResultCard
          results={results}
          subject={subject}
          examType={examType}
          onRetake={onRetake}
        />
      )}

      {activeSection === 'A' && (
        <>
          <ExamSectionA
            questions={exam.sectionA}
            answers={answersA}
            onAnswer={() => {}}
            isReview
            markedQuestions={exam.sectionA}
            onExplain={(idx) => handleExplain('A', idx)}
            explaining={explaining}
          />
          {renderExplainArea('A')}
        </>
      )}

      {activeSection === 'B' && (
        <>
          <ExamSectionB
            questions={exam.sectionB}
            answers={answersB}
            onAnswer={() => {}}
            isReview
            markedQuestions={exam.sectionB}
            onExplain={(idx) => handleExplain('B', idx)}
            explaining={explaining}
          />
          {renderExplainArea('B')}
        </>
      )}

      {activeSection === 'C' && (
        <>
          <ExamSectionC
            questions={exam.sectionC}
            answerCount={exam.sectionCAnswerCount || 1}
            selectedIndices={answerCIndices}
            answers={answersC}
            onToggleQuestion={() => {}}
            onAnswerChange={() => {}}
            isReview
            markedQuestions={exam.sectionC}
            onExplain={(idx) => handleExplain('C', idx)}
            explaining={explaining}
            sectionLabel={sectionCLabel}
          />
          {renderExplainArea('C')}
        </>
      )}
    </>
  )
}
