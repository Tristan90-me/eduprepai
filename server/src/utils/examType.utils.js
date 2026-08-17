// ── Exam-type access control ────────────────────────────────────
// Students are locked to the exam type on their own profile — a
// WASSCE student cannot request BECE practice/predictions/mock exams
// and vice versa. Admins manage content for both exam types, so
// their requests are trusted as-is.
//
// Any client-supplied `examType` is ignored for students and
// replaced with their registered exam type. This has to happen
// server-side (not just hidden in the UI) since a student could
// otherwise call the API directly with a different examType.
export const resolveExamType = (req, requestedExamType) => {
  if (req.user.role === 'student') return req.user.examType
  return requestedExamType || 'WASSCE'
}
