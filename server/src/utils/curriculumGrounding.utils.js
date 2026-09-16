import Question from '../models/Question.model.js'
import { getComputingCurriculumDetail } from '../data/computingCurriculumDetail.js'

// ── Registry of per-subject curriculum-detail lookups ───────────
// Only Computing is wired up for this pilot. Adding another subject
// later means adding one entry here plus its own data file — the
// call sites in aiQuestions.controller.js, marking.utils.js and
// mockGenerator.utils.js never need to change, and every subject
// not listed here behaves exactly as before (ungrounded).
const SUBJECT_DETAIL_LOOKUPS = {
  'Computing': getComputingCurriculumDetail,
}

// ── Lightweight, DB-free scope lookup ───────────────────────────
// Used for marking/explanation, where the AI needs to know the
// syllabus scope and vocabulary but doesn't need worked examples.
export const getCurriculumScope = (subject, topic) => {
  const lookup = SUBJECT_DETAIL_LOOKUPS[subject]
  if (!lookup || !topic) return null
  return lookup(topic)
}

// ── Full grounding context (adds real past-question examples) ──
// Used for AI generation, where a few real past questions on the
// same topic are valuable few-shot examples of the syllabus's
// actual style and scope — reusing the question bank we already
// have rather than needing new source material.
export const getGroundingContext = async (subject, topic) => {
  const scope = getCurriculumScope(subject, topic)
  if (!scope) return null

  const sampleQuestions = await Question.find({ subject, topic, isActive: true })
    .select('questionText type')
    .limit(3)
    .lean()
    .catch(() => [])

  return { ...scope, sampleQuestions }
}

// ── Full prompt block — generation contexts ─────────────────────
export const formatGroundingBlock = (context) => {
  if (!context) return ''

  const examples = context.sampleQuestions?.length
    ? `\nReal past questions on this topic — match this style and scope:\n${context.sampleQuestions.map((q, i) => `${i + 1}. [${q.type}] ${q.questionText}`).join('\n')}`
    : ''

  return `

── CURRICULUM GROUNDING (GES Computing syllabus) ──
Syllabus scope for this topic: ${context.standards}
Key vocabulary/terms to use: ${context.vocabulary.join(', ')}
Stay strictly within this scope — do not introduce methods, terminology, or software not covered here or beyond the JHS (Basic 7-9) level. Use British/Ghanaian English spelling.${examples}
── END CURRICULUM GROUNDING ──`
}

// ── Compact scope note — marking/explanation contexts ───────────
// No examples here on purpose: grading/explaining needs the scope
// boundary, not style samples.
export const formatScopeNote = (scope) => {
  if (!scope) return ''

  return `

── CURRICULUM SCOPE (GES Computing syllabus) ──
${scope.standards}
Key vocabulary/terms: ${scope.vocabulary.join(', ')}
Judge/explain strictly within this JHS (Basic 7-9) scope — don't expect or introduce content beyond it.
── END CURRICULUM SCOPE ──`
}
