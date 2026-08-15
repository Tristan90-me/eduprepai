// ── calculateWAECGrade ─────────────────────────────────────────
// Pure function — takes score and total available marks.
// Returns grade object matching WAEC grading scale.
export const calculateWAECGrade = (score, totalMarks) => {
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