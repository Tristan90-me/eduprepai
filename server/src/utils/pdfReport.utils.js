import PDFDocument from 'pdfkit'
import { calculateGrade } from './marking.utils.js'

// ── generateMockExamPDF ────────────────────────────────────────
// Generates a professionally formatted PDF exam report.
// Returns a Buffer containing the complete PDF file.
// Called from the report controller and streamed to the client.
export const generateMockExamPDF = (exam, student) => {
  return new Promise((resolve, reject) => {
    try {
      // bufferPages is required for the footer loop below — without it,
      // PDFKit flushes each page as soon as addPage() moves past it, so
      // switchToPage() on an earlier page throws "out of bounds" once
      // there's more than one page.
      const doc    = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true })
      const chunks = []

      doc.on('data',  chunk => chunks.push(chunk))
      doc.on('end',   ()    => resolve(Buffer.concat(chunks)))
      doc.on('error', err   => reject(err))

      const { results, subject, examType, year } = exam
      const grade  = calculateGrade(results.totalMarks, results.availableMarks, examType)
      const isBECE = examType === 'BECE'

      // Grade colour buckets — WASSCE has a 3-tier grouping (A1-B3 / C4-C6 / D7-F9)
      // and BECE groups its own scale the same way (1-3 / 4-6 / 7-9), but the
      // middle tier uses a different colour per scale (teal for WASSCE credits,
      // amber for BECE's middle band).
      const bucketFor = (g) => {
        if (isBECE) {
          if (['1', '2', '3'].includes(g)) return 0
          if (['4', '5', '6'].includes(g)) return 1
          return 2
        }
        if (['A1', 'B2', 'B3'].includes(g)) return 0
        if (['C4', 'C5', 'C6'].includes(g)) return 1
        return 2
      }

      // ── Colours ────────────────────────────────────────────
      const TEAL   = '#0D9488'
      const DARK   = '#134E4A'
      const AMBER  = '#D97706'
      const SLATE  = '#64748B'
      const BLACK  = '#1E293B'
      const WHITE  = '#FFFFFF'
      const LIGHT  = '#F0FDFA'

      const bucketBg   = isBECE ? ['#D1FAE5', '#FEF3C7', '#FEE2E2'] : ['#D1FAE5', LIGHT, '#FEE2E2']
      const bucketText = isBECE ? ['#065F46', '#92400E', '#991B1B'] : ['#065F46', DARK, '#991B1B']

      // ── Helper: draw a horizontal rule ─────────────────────
      const rule = (y, colour = '#E2E8F0') => {
        doc.moveTo(50, y).lineTo(545, y).strokeColor(colour).lineWidth(0.5).stroke()
      }

      // ── Helper: coloured section header bar ────────────────
      const sectionHeader = (text, y, colour = TEAL) => {
        doc.rect(50, y, 495, 22).fill(colour)
        doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE)
           .text(text, 58, y + 6)
        doc.fillColor(BLACK)
        return y + 30
      }

      // ══════════════════════════════════════════════════════
      // PAGE 1 — Cover & Score Summary
      // ══════════════════════════════════════════════════════

      // Header band
      doc.rect(0, 0, 595, 80).fill(DARK)
      doc.font('Helvetica-Bold').fontSize(14).fillColor(WHITE)
         .text('EDUPREPAI', 50, 18, { align: 'center', width: 495 })
      doc.font('Helvetica').fontSize(9).fillColor('#CCFBF1')
         .text(`${examType} Practice Exam Report — AI-generated, not an official WAEC document · ${year}`, 50, 38, { align: 'center', width: 495 })
      doc.font('Helvetica-Bold').fontSize(11).fillColor(WHITE)
         .text(subject, 50, 55, { align: 'center', width: 495 })

      // Student info row
      doc.rect(50, 95, 495, 50).fill(LIGHT).stroke('#CCFBF1')
      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text('CANDIDATE:', 60, 105)
      doc.font('Helvetica').fontSize(9).fillColor(BLACK).text(student.fullName || 'Unknown', 130, 105)

      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text('SCHOOL:', 60, 120)
      doc.font('Helvetica').fontSize(9).fillColor(BLACK).text(student.school || '—', 130, 120)

      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text('DATE:', 350, 105)
      doc.font('Helvetica').fontSize(9).fillColor(BLACK)
         .text(new Date(exam.submittedAt || exam.createdAt).toLocaleDateString('en-GB', {
           day: 'numeric', month: 'long', year: 'numeric',
         }), 395, 105)

      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text('EXAM TYPE:', 350, 120)
      doc.font('Helvetica').fontSize(9).fillColor(BLACK).text(examType, 415, 120)

      // Total score hero
      let y = 165
      doc.rect(50, y, 495, 80).fill(LIGHT)
      doc.font('Helvetica-Bold').fontSize(36).fillColor(TEAL)
         .text(`${results.totalMarks}`, 50, y + 12, { align: 'center', width: 495 })
      doc.font('Helvetica').fontSize(12).fillColor(SLATE)
         .text(`out of ${results.availableMarks} marks`, 50, y + 52, { align: 'center', width: 495 })

      // Grade badge
      const gradeX = 270
      const badgeBucket = bucketFor(results.waecGrade)
      doc.rect(gradeX - 30, y + 12, 85, 36).fill(bucketBg[badgeBucket])
      doc.font('Helvetica-Bold').fontSize(22).fillColor(bucketText[badgeBucket])
         .text(results.waecGrade, gradeX - 22, y + 18)

      doc.font('Helvetica').fontSize(9).fillColor(SLATE)
         .text(results.gradeLabel, gradeX - 30, y + 52, { width: 85, align: 'center' })

      // Grade scale
      y = 265
      doc.font('Helvetica-Bold').fontSize(8).fillColor(SLATE)
         .text(isBECE ? 'BECE GRADING SCALE' : 'WAEC GRADING SCALE', 50, y)
      y += 12

      const grades = isBECE ? [
        { g:'1', r:'90-100%' },
        { g:'2', r:'80-89%'  },
        { g:'3', r:'70-79%'  },
        { g:'4', r:'60-69%'  },
        { g:'5', r:'55-59%'  },
        { g:'6', r:'50-54%'  },
        { g:'7', r:'40-49%'  },
        { g:'8', r:'35-39%'  },
        { g:'9', r:'0-34%'   },
      ] : [
        { g:'A1', r:'75-100%' },
        { g:'B2', r:'70-74%'  },
        { g:'B3', r:'65-69%'  },
        { g:'C4', r:'60-64%'  },
        { g:'C5', r:'55-59%'  },
        { g:'C6', r:'50-54%'  },
        { g:'D7', r:'45-49%'  },
        { g:'E8', r:'40-44%'  },
        { g:'F9', r:'0-39%'   },
      ]

      grades.forEach((g, i) => {
        const gx = 50 + i * 55
        const isThis = g.g === results.waecGrade
        const bucket = bucketFor(g.g)
        doc.rect(gx, y, 52, 22)
           .fill(isThis ? TEAL : bucketBg[bucket])
           .stroke(isThis ? TEAL : '#E2E8F0')
        doc.font(isThis ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(8)
           .fillColor(isThis ? WHITE : bucketText[bucket])
           .text(g.g, gx + 4, y + 3)
        doc.font('Helvetica').fontSize(6).fillColor(isThis ? '#CCFBF1' : SLATE)
           .text(g.r, gx + 1, y + 13)
      })

      // Section scores table
      y = 315
      y = sectionHeader('SECTION SCORES', y)

      // `??`, not `||` — a subject can genuinely have a real 0 total for a
      // section (e.g. BECE Mathematics has no Section B at all), which
      // must survive as 0 so the row below gets filtered out, not masked
      // into a fake 40/20-mark section that was never actually offered.
      const sectionATotal = results.sectionATotal ?? 40
      const sectionBTotal = results.sectionBTotal ?? 40
      const sectionCTotal = results.sectionCTotal ?? 20

      // A subject with no real Section B at all (e.g. BECE Mathematics)
      // has its actual WAEC "Section B" living in this app's sectionC
      // bucket — print it as "Section B" instead of the internal "C".
      const sectionCLabel = sectionBTotal === 0 ? 'B' : 'C'

      const sections = [
        { name: 'Section A — Multiple Choice Questions', marks: results.sectionAMarks, total: sectionATotal, pct: Math.round((results.sectionAMarks/sectionATotal)*100) },
        { name: 'Section B — Structured Questions',     marks: results.sectionBMarks, total: sectionBTotal, pct: Math.round((results.sectionBMarks/sectionBTotal)*100) },
        { name: `Section ${sectionCLabel} — Essay Question`, marks: results.sectionCMarks, total: sectionCTotal, pct: Math.round((results.sectionCMarks/sectionCTotal)*100) },
      ].filter(s => s.total > 0)

      sections.forEach((s, i) => {
        const rowY = y + i * 26
        if (i % 2 === 0) doc.rect(50, rowY, 495, 24).fill('#F8FFFE')
        doc.font('Helvetica').fontSize(9).fillColor(BLACK)
           .text(s.name, 58, rowY + 8)
        doc.font('Helvetica-Bold').fontSize(9).fillColor(TEAL)
           .text(`${s.marks}/${s.total}`, 420, rowY + 8, { width: 60, align: 'right' })
        doc.font('Helvetica').fontSize(9).fillColor(SLATE)
           .text(`${s.pct}%`, 490, rowY + 8, { width: 40, align: 'right' })

        // Mini bar
        const barX   = 250
        const barW   = 150
        const fillW  = Math.round((s.pct / 100) * barW)
        doc.rect(barX, rowY + 10, barW, 6).fill('#E2E8F0')
        doc.rect(barX, rowY + 10, fillW, 6).fill(s.pct >= 60 ? TEAL : s.pct >= 40 ? AMBER : '#EF4444')
      })

      y += 80

      // Examiner comment
      y = sectionHeader("EXAMINER'S COMMENT", y)
      doc.rect(50, y, 495, 60).fill(LIGHT)
      doc.font('Helvetica-Oblique').fontSize(9).fillColor(BLACK)
         .text(results.examinerComment || 'No examiner comment available.', 60, y + 8, {
           width: 475, height: 50,
         })
      y += 70

      // ══════════════════════════════════════════════════════
      // PAGE 2 — Detailed Section Reviews
      // ══════════════════════════════════════════════════════
      doc.addPage()

      // Section B review — some subjects have no Section B at all (e.g.
      // BECE Mathematics), so skip the heading entirely rather than
      // printing it with zero rows beneath.
      y = 50
      if (exam.sectionB.length > 0) {
        y = sectionHeader('SECTION B — STRUCTURED QUESTIONS REVIEW', y)

        exam.sectionB.forEach((q, i) => {
          if (y > 680) { doc.addPage(); y = 50 }

          doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
             .text(`Question ${i + 1}: ${q.topic || ''}`, 58, y)
          doc.font('Helvetica').fontSize(8).fillColor(TEAL)
             .text(`${q.marksAwarded ?? '—'}/${q.marks} marks`, 440, y, { width: 100, align: 'right' })
          y += 14

          if (q.aiFeedback) {
            doc.font('Helvetica').fontSize(8).fillColor(SLATE)
               .text(q.aiFeedback, 58, y, { width: 480, lineGap: 2 })
            y += doc.heightOfString(q.aiFeedback, { width: 480 }) + 8
          }

          if (q.partResults?.length > 0) {
            q.partResults.forEach(pr => {
              if (y > 700) { doc.addPage(); y = 50 }
              doc.font('Helvetica-Bold').fontSize(7.5).fillColor(DARK)
                 .text(`  (${pr.part || pr.name}) ${pr.marksAwarded}/${pr.marksAvailable}m`, 62, y)
              doc.font('Helvetica').fontSize(7.5).fillColor(SLATE)
                 .text(`— ${pr.feedback || ''}`, 130, y, { width: 410 })
              y += 12
            })
          }

          rule(y); y += 8
        })
      }

      // Section C review — `.find()` only ever showed the FIRST answered
      // question, silently dropping the rest whenever more than one is
      // answered (e.g. BECE Computing answers 3, Mathematics answers 4).
      // Loop over every answered one instead.
      if (y > 600) { doc.addPage(); y = 50 }
      y = sectionHeader(`SECTION ${sectionCLabel} — ESSAY QUESTION REVIEW`, y)

      const essaysAnswered = exam.sectionC.filter(q => q.studentAnswer?.trim())
      if (essaysAnswered.length > 0) {
        essaysAnswered.forEach((essayAnswered, i) => {
          if (i > 0 && y > 600) { doc.addPage(); y = 50 }

          doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
             .text(essayAnswered.topic || 'Essay', 58, y)
          doc.font('Helvetica').fontSize(8).fillColor(TEAL)
             .text(`${essayAnswered.marksAwarded ?? '—'}/${essayAnswered.marks} marks`, 440, y, { width: 100, align: 'right' })
          y += 14

          if (essayAnswered.aiFeedback) {
            doc.font('Helvetica').fontSize(8).fillColor(SLATE)
               .text(essayAnswered.aiFeedback, 58, y, { width: 480, lineGap: 2 })
            y += doc.heightOfString(essayAnswered.aiFeedback, { width: 480 }) + 8
          }

          if (essayAnswered.partResults?.length > 0) {
            if (y > 650) { doc.addPage(); y = 50 }
            y = sectionHeader('MARKING CRITERIA', y, SLATE)
            essayAnswered.partResults.forEach(cr => {
              if (y > 700) { doc.addPage(); y = 50 }
              doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK)
                 .text(`${cr.name || cr.part}: ${cr.marksAwarded}/${cr.marksAvailable}m`, 58, y)
              doc.font('Helvetica').fontSize(8).fillColor(SLATE)
                 .text(cr.feedback || '', 58, y + 10, { width: 480 })
              y += doc.heightOfString(cr.feedback || '', { width: 480 }) + 18
            })
          }

          rule(y); y += 8
        })
      } else {
        doc.font('Helvetica-Oblique').fontSize(9).fillColor(SLATE)
           .text('No essay question was attempted.', 58, y)
        y += 20
      }

      // ══════════════════════════════════════════════════════
      // PAGE 3 — Study Recommendations
      // ══════════════════════════════════════════════════════
      doc.addPage()
      y = 50
      y = sectionHeader('PERSONALISED STUDY RECOMMENDATIONS', y)

      const weakSections = sections
        .filter(s => s.pct < 60)
        .sort((a, b) => a.pct - b.pct)

      if (weakSections.length > 0) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
           .text('Priority areas for improvement:', 58, y)
        y += 14
        weakSections.forEach(s => {
          doc.rect(58, y, 8, 8).fill('#EF4444')
          doc.font('Helvetica').fontSize(9).fillColor(BLACK)
             .text(`${s.name} — scored ${s.pct}% (${s.marks}/${s.total} marks)`, 72, y)
          y += 14
        })
      } else {
        doc.font('Helvetica').fontSize(9).fillColor('#065F46')
           .text('Excellent performance across all sections. Focus on maintaining consistency.', 58, y)
        y += 14
      }

      y += 8
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
         .text('General recommendations:', 58, y)
      y += 14

      const recommendations = [
        `Review ${subject} topics that were answered incorrectly in the theory sections.`,
        grade.percent < 50
          ? 'Prioritise foundation-level practice before attempting more advanced questions.'
          : 'Continue with intermediate and advanced practice questions to push your grade higher.',
        'Use the EduPrepAI prediction engine to focus revision on high-probability topics.',
        'Attempt at least one more mock examination before your sitting date.',
        'For essay questions, practise planning your argument before writing.',
      ]

      recommendations.forEach(r => {
        if (y > 700) { doc.addPage(); y = 50 }
        doc.rect(58, y + 2, 5, 5).fill(TEAL)
        doc.font('Helvetica').fontSize(9).fillColor(BLACK)
           .text(r, 70, y, { width: 465 })
        y += doc.heightOfString(r, { width: 465 }) + 8
      })

      // Footer on all pages
      const pageCount = doc.bufferedPageRange().count
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i)
        doc.rect(0, 810, 595, 32).fill(DARK)
        doc.font('Helvetica').fontSize(7).fillColor('#CCFBF1')
           .text(
             `EduPrepAI Practice Report — ${student.fullName || 'Candidate'} — ${subject} ${examType} ${year}`,
             50, 820, { align: 'left', width: 350 }
           )
        doc.font('Helvetica').fontSize(7).fillColor('#CCFBF1')
           .text(`Page ${i + 1} of ${pageCount}`, 50, 820, { align: 'right', width: 495 })
      }

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}