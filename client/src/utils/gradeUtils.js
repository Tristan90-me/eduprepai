// ── calculateWASSCEGrade ────────────────────────────────────────
// Pure function — takes score and total available marks.
// Returns grade object matching the WASSCE A1-F9 grading scale.
export const calculateWASSCEGrade = (score, totalMarks) => {
  if (!totalMarks) return { grade: 'N/A', label: 'No marks', percent: 0 }

  const percent = Math.round((score / totalMarks) * 100)

  if (percent >= 75) return { grade: 'A1', label: 'Excellent',  percent }
  if (percent >= 70) return { grade: 'B2', label: 'Very Good',  percent }
  if (percent >= 65) return { grade: 'B3', label: 'Good',       percent }
  if (percent >= 60) return { grade: 'C4', label: 'Credit',     percent }
  if (percent >= 55) return { grade: 'C5', label: 'Credit',     percent }
  if (percent >= 50) return { grade: 'C6', label: 'Credit',     percent }
  if (percent >= 45) return { grade: 'D7', label: 'Pass',       percent }
  if (percent >= 40) return { grade: 'E8', label: 'Pass',       percent }
  return                     { grade: 'F9', label: 'Fail',       percent }
}

// ── calculateBECEGrade ──────────────────────────────────────────
// Pure function — returns grade object matching the BECE 1-9 grading scale.
export const calculateBECEGrade = (score, totalMarks) => {
  if (!totalMarks) return { grade: 'N/A', label: 'No marks', percent: 0 }

  const percent = Math.round((score / totalMarks) * 100)

  if (percent >= 90) return { grade: '1', label: 'Highest',      percent }
  if (percent >= 80) return { grade: '2', label: 'Higher',       percent }
  if (percent >= 70) return { grade: '3', label: 'High',         percent }
  if (percent >= 60) return { grade: '4', label: 'High Average', percent }
  if (percent >= 55) return { grade: '5', label: 'Average',      percent }
  if (percent >= 50) return { grade: '6', label: 'Low Average',  percent }
  if (percent >= 40) return { grade: '7', label: 'Low',          percent }
  if (percent >= 35) return { grade: '8', label: 'Lower',        percent }
  return                     { grade: '9', label: 'Lowest',       percent }
}

// ── calculateGrade ──────────────────────────────────────────────
// Dispatcher — routes to the correct scale based on examType.
// Defaults to WASSCE, matching the server's resolveExamType convention.
export const calculateGrade = (score, totalMarks, examType) =>
  examType === 'BECE'
    ? calculateBECEGrade(score, totalMarks)
    : calculateWASSCEGrade(score, totalMarks)

// ── gradeColour ─────────────────────────────────────────────────
// Shared Tailwind class lookup for grade badges — replaces the
// inline gradeColour() copies that used to live in ExamResultCard,
// SessionSummary, ReportPage, MockExamPage, and AnalyticsPage.
// WASSCE buckets: A1-B3 / C4-C6 / D7-E8 / F9
// BECE buckets:   1-3 / 4-6 / 7-9 (BECE's own scale only groups into three bands)
export const gradeColour = (grade, examType) => {
  if (examType === 'BECE') {
    if (['1', '2', '3'].includes(grade)) return 'text-green-700 bg-green-50 border-green-300'
    if (['4', '5', '6'].includes(grade)) return 'text-amber-700 bg-amber-50 border-amber-300'
    return 'text-red-700 bg-red-50 border-red-300'
  }
  if (['A1', 'B2', 'B3'].includes(grade)) return 'text-green-700 bg-green-50 border-green-300'
  if (['C4', 'C5', 'C6'].includes(grade)) return 'text-teal-700 bg-teal-50 border-teal-300'
  if (['D7', 'E8'].includes(grade))       return 'text-amber-700 bg-amber-50 border-amber-300'
  return 'text-red-700 bg-red-50 border-red-300'
}

// ── gradeBadgeBucket ────────────────────────────────────────────
// Same tiering as gradeColour, but returns a bare colour keyword
// (green/teal/amber/red) for callers using `badge-{colour}` utility
// classes (e.g. MockExamPage's past-attempts list) instead of the
// full text/bg/border class string.
export const gradeBadgeBucket = (grade, examType) => {
  if (examType === 'BECE') {
    if (['1', '2', '3'].includes(grade)) return 'green'
    if (['4', '5', '6'].includes(grade)) return 'amber'
    return 'red'
  }
  if (['A1', 'B2', 'B3'].includes(grade)) return 'green'
  if (['C4', 'C5', 'C6'].includes(grade)) return 'teal'
  if (['D7', 'E8'].includes(grade))       return 'amber'
  return 'red'
}
