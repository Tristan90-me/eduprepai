// ── Subject lists by exam type ─────────────────────────────────
// Single source of truth for which subjects belong to which exam.
// Used by registration, settings, and every subject picker so a
// student only ever sees subjects that exist for their exam type.

// Ghanaian Language isn't a subject a student is examined in directly —
// they study exactly one of these languages, and that specific
// language becomes their actual subject (mirrors how WAEC itself
// names them: each language has its own syllabus and past papers).
export const GHANAIAN_LANGUAGES = ['Asante Twi', 'Akuapim Twi', 'Ga', 'Ewe']

export const SUBJECTS_WASSCE = [
  'Mathematics', 'English Language', 'Integrated Science', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Economics', 'Elective Mathematics', 'Geography',
]

export const SUBJECTS_BECE = [
  'Mathematics', 'English Language', 'Integrated Science', 'Social Studies',
  'French', 'Computing', 'Religious & Moral Education', 'Creative Arts and Design', 'Career Technology',
  ...GHANAIAN_LANGUAGES,
]

export const getSubjectsForExamType = (examType) =>
  examType === 'BECE' ? SUBJECTS_BECE : SUBJECTS_WASSCE

// ── Subject groups ────────────────────────────────────────────
// A group is a picker-only category standing in for several concrete
// subjects. 'Ghanaian Language' never appears as a stored subject
// value anywhere in the app — only its members (e.g. 'Asante Twi') do.
export const SUBJECT_GROUPS = {
  'Ghanaian Language': GHANAIAN_LANGUAGES,
}

export const getGroupLabelForSubject = (subject) => {
  for (const [group, members] of Object.entries(SUBJECT_GROUPS)) {
    if (members.includes(subject)) return group
  }
  return null
}

// Collapses a flat subject list into picker "tiles": standalone
// subjects pass through as-is; subjects belonging to a group are
// collapsed into a single tile for that group (rendered once,
// regardless of where its members fall in the source list).
export const getPickerTiles = (subjectList) => {
  const tiles = []
  const seenGroups = new Set()
  subjectList.forEach(s => {
    const group = getGroupLabelForSubject(s)
    if (group) {
      if (!seenGroups.has(group)) {
        seenGroups.add(group)
        tiles.push({ type: 'group', label: group, options: SUBJECT_GROUPS[group] })
      }
    } else {
      tiles.push({ type: 'subject', label: s })
    }
  })
  return tiles
}

// ── AI generation quality risk ──────────────────────────────────
// Subjects where AI-generated content needs extra human scrutiny
// before admins trust it — currently the Ghanaian languages, since
// LLM fluency and orthographic accuracy there is far less reliable
// than in English. Used to gate admin approval of AI-written content.
export const AI_RISK_SUBJECTS = GHANAIAN_LANGUAGES
