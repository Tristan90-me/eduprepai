// ── Subject lists by exam type ─────────────────────────────────
// Single source of truth for which subjects belong to which exam.
// Used by registration, settings, and every subject picker so a
// student only ever sees subjects that exist for their exam type.
export const SUBJECTS_WASSCE = [
  'Mathematics', 'English Language', 'Integrated Science', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Economics', 'Elective Mathematics', 'Geography',
]

export const SUBJECTS_BECE = [
  'Mathematics', 'English Language', 'Integrated Science', 'Social Studies',
  'French', 'Computing', 'Religious & Moral Education', 'Creative Arts and Design', 'Career Technology',
]

export const getSubjectsForExamType = (examType) =>
  examType === 'BECE' ? SUBJECTS_BECE : SUBJECTS_WASSCE
