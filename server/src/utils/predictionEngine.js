// ── predictionEngine.js ────────────────────────────────────────
// Pure scoring functions. Takes question data, returns topic scores.
// No side effects — same input always produces same output.

const CURRENT_YEAR = new Date().getFullYear()

// ── Subject-specific score weights ────────────────────────────
// Different subjects have different predictability patterns.
// Mathematics topics cycle predictably → gap score matters more.
// English Language themes shift with current events → recency matters more.
const SUBJECT_WEIGHTS = {
  'Mathematics': {
    frequency: 0.25, recency: 0.25, gap: 0.25, syllabus: 0.25,
  },
  'English Language': {
    frequency: 0.20, recency: 0.35, gap: 0.15, syllabus: 0.30,
  },
  'Integrated Science': {
    frequency: 0.30, recency: 0.25, gap: 0.20, syllabus: 0.25,
  },
  'Social Studies': {
    frequency: 0.25, recency: 0.30, gap: 0.15, syllabus: 0.30,
  },
  // Default weights for all other subjects
  default: {
    frequency: 0.25, recency: 0.25, gap: 0.25, syllabus: 0.25,
  },
}

// ── Main export ────────────────────────────────────────────────
// Receives all questions for one subject, returns scored topic array
// sorted from highest to lowest predicted confidence.
export const analyseTopics = (questions, subject) => {
  // Step 1: Group all questions by topic
  const topicMap = groupByTopic(questions)

  // Step 2: Score each topic across all 8 signals
  const scored = Object.entries(topicMap).map(([topic, qs]) => {
    return scoreOneTopic(topic, qs, subject, topicMap)
  })

  // Step 3: Sort highest raw score first
  scored.sort((a, b) => b.rawScore - a.rawScore)

  // Step 4: Normalise raw scores to 0–100 confidence scale
  return normaliseConfidence(scored)
}

// ── Step 1: Group questions by topic ──────────────────────────
const groupByTopic = (questions) => {
  return questions.reduce((map, q) => {
    if (!map[q.topic]) map[q.topic] = []
    map[q.topic].push(q)
    return map
  }, {})
}

// ── Step 2: Score one topic ────────────────────────────────────
const scoreOneTopic = (topic, questions, subject, allTopics) => {
  const years     = [...new Set(questions.map(q => q.year))].sort()
  const latestYear = Math.max(...years)
  const weights   = SUBJECT_WEIGHTS[subject] || SUBJECT_WEIGHTS.default

  // Signal 1 — Frequency (normalised 0–1 over 10 years)
  // How many distinct years did this topic appear in?
  const frequencyScore = Math.min(years.length / 10, 1)

  // Signal 2 — Recency (exponential decay: recent years worth more)
  // A topic seen in 2024 scores higher than one seen in 2016.
  const recencyScore = years.reduce((sum, yr) => {
    const age    = CURRENT_YEAR - yr         // how many years ago
    const weight = Math.exp(-age * 0.15)     // decay factor: older = lower
    return sum + weight
  }, 0) / years.length

  // Signal 3 — Gap score (how many years since last appearance)
  // A topic absent for 3+ years is "due" to return.
  const yearsSinceLastSeen = CURRENT_YEAR - latestYear
  // Gap score peaks at 3 years then plateaus — extreme gaps are less reliable
  const gapScore = Math.min(yearsSinceLastSeen / 3, 1)

  // Signal 4 — Trend direction
  // Compare frequency in first half vs second half of the 10-year window
  const midYear   = CURRENT_YEAR - 5
  const earlyCount = years.filter(y => y <= midYear).length
  const recentCount = years.filter(y => y > midYear).length
  // Returns -1 (falling), 0 (stable), or +1 (rising)
  const trendDirection = recentCount > earlyCount ? 1
                       : recentCount < earlyCount ? -1 : 0

  // Signal 5 — Year-on-year data (for sparkline chart on the UI)
  const yearlyFrequency = buildYearlyFrequency(questions)

  // Signal 6 — Section type prediction
  // What section does this topic most commonly appear in?
  const sectionForecast = predictSection(questions)

  // Signal 7 — Topic clusters
  // Which topics appear in the same years as this one?
  const clusters = findClusters(topic, years, allTopics)

  // Signal 8 — Difficulty trend
  // Is the examiner setting harder or easier questions on this topic?
  const avgDifficulty = questions.reduce((s, q) => s + q.difficulty, 0) / questions.length
  const difficultyTrend = avgDifficulty > 3.5 ? 'increasing'
                        : avgDifficulty < 2.5 ? 'decreasing' : 'stable'

  // ── Weighted raw score (0–1 scale) ──────────────────────────
  // Syllabus signal uses frequency as a proxy until real syllabus
  // data is loaded — once you have syllabus documents this can be
  // replaced with actual curriculum prominence values.
  const syllabusProxy = frequencyScore
  const rawScore =
    (frequencyScore * weights.frequency) +
    (recencyScore   * weights.recency)   +
    (gapScore       * weights.gap)       +
    (syllabusProxy  * weights.syllabus)

  // Trend direction boosts or penalises the raw score slightly
  const trendBoost = trendDirection * 0.05
  const finalRaw   = Math.max(0, Math.min(1, rawScore + trendBoost))

  return {
    topic,
    rawScore:        finalRaw,
    confidence:      0,          // filled in by normaliseConfidence()
    tier:            '',         // filled in after confidence is set
    frequencyScore:  Math.round(frequencyScore * 100),
    recencyScore:    Math.round(recencyScore   * 100),
    gapScore:        Math.round(gapScore       * 100),
    trendDirection,              // -1, 0, or 1
    yearlyFrequency,             // array of { year, count } for sparkline
    sectionForecast,             // { questionType, section, expectedMarks, confidence }
    clusters,                    // array of related topic names
    difficultyTrend,             // 'increasing', 'stable', 'decreasing'
    yearsAppeared:   years,
    latestYear,
    totalQuestions:  questions.length,
    lastSeen:        latestYear,
  }
}

// ── Yearly frequency (sparkline data) ─────────────────────────
const buildYearlyFrequency = (questions) => {
  const countByYear = questions.reduce((map, q) => {
    map[q.year] = (map[q.year] || 0) + 1
    return map
  }, {})

  // Return last 10 years as a sorted array
  const startYear = CURRENT_YEAR - 10
  return Array.from({ length: 10 }, (_, i) => {
    const year = startYear + i + 1
    return { year, count: countByYear[year] || 0 }
  })
}

// ── Section type prediction ────────────────────────────────────
const predictSection = (questions) => {
  // Count how often each type appears for this topic
  const counts = questions.reduce((map, q) => {
    const key = `${q.type}|${q.section}`
    map[key] = (map[key] || 0) + 1
    return map
  }, {})

  // Find the most common type+section combination
  const mostCommon = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)[0]

  if (!mostCommon) return null

  const [typeSection] = mostCommon
  const [type, section] = typeSection.split('|')

  // Estimate marks based on section
  const marksMap = { A: 1, B: 10, C: 20 }

  return {
    // Named questionType, not type — a field literally named `type`
    // inside a Mongoose nested-object schema gets misparsed as the
    // field's own SchemaType declaration instead of nested data.
    questionType:  type,
    section:       section || 'A',
    expectedMarks: marksMap[section] || 1,
    confidence:    Math.round((mostCommon[1] / questions.length) * 100),
  }
}

// ── Topic cluster detection ────────────────────────────────────
// Finds topics that appeared in the same years as this topic.
// Co-occurrence suggests they may be tested together.
const findClusters = (currentTopic, currentYears, allTopics) => {
  const yearSet = new Set(currentYears)
  const clusters = []

  for (const [topic, questions] of Object.entries(allTopics)) {
    if (topic === currentTopic) continue

    const otherYears = [...new Set(questions.map(q => q.year))]
    const overlap    = otherYears.filter(y => yearSet.has(y)).length

    // If this topic appeared in 50%+ of the same years, it's a cluster
    if (overlap / currentYears.length >= 0.5) {
      clusters.push(topic)
    }
  }

  // Return top 3 most relevant cluster topics
  return clusters.slice(0, 3)
}

// ── Normalise scores to 0–100 confidence ──────────────────────
// Scales the highest raw score to ~95% and others proportionally.
// Then assigns hot/warm/watch tiers.
const normaliseConfidence = (scored) => {
  if (scored.length === 0) return []

  const maxRaw = scored[0].rawScore

  return scored.map(topic => {
    // Scale to a 0–95 range (leaving room — 100% would be misleading)
    const confidence = maxRaw > 0
      ? Math.round((topic.rawScore / maxRaw) * 95)
      : 0

    const tier = confidence >= 70 ? 'hot'
               : confidence >= 45 ? 'warm'
               : 'watch'

    return { ...topic, confidence, tier }
  })
}