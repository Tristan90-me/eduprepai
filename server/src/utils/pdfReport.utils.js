import PDFDocument from 'pdfkit'
import { calculateWAECGrade } from './marking.utils.js'

// ── generateMockExamPDF ────────────────────────────────────────
// Generates a professionally formatted PDF exam report.
// Returns a Buffer containing the complete PDF file.
// Called from the report controller and streamed to the client.
export const generateMockExamPDF = (exam, student) => {
  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ margin: 50, size: 'A4' })
      const chunks = []

      doc.on('data',  chunk => chunks.push(chunk))
      doc.on('end',   ()    => resolve(Buffer.concat(chunks)))
      doc.on('error', err   => reject(err))

      const { results, subject, examType, year } = exam
      const grade = calculateWAECGrade(results.totalMarks, results.availableMarks)

      // ── Colours ────────────────────────────────────────────
      const TEAL   = '#0D9488'
      const DARK   = '#134E4A'
      const AMBER  = '#D97706'
      const SLATE  = '#64748B'
      const BLACK  = '#1E293B'
      const WHITE  = '#FFFFFF'
      const LIGHT  = '#F0FDFA'

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
         .text('WEST AFRICAN EXAMINATIONS COUNCIL', 50, 18, { align: 'center', width: 495 })
      doc.font('Helvetica').fontSize(9).fillColor('#CCFBF1')
         .text(`${examType} — AI-Generated Practice Examination Report · ${year}`, 50, 38, { align: 'center', width: 495 })
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
      doc.rect(gradeX - 30, y + 12, 85, 36).fill(
        ['A1','B2','B3'].includes(results.waecGrade) ? '#D1FAE5' :
        ['C4','C5','C6'].includes(results.waecGrade) ? LIGHT : '#FEE2E2'
      )
      doc.font('Helvetica-Bold').fontSize(22).fillColor(
        ['A1','B2','B3'].includes(results.waecGrade) ? '#065F46' :
        ['C4','C5','C6'].includes(results.waecGrade) ? DARK : '#991B1B'
      ).text(results.waecGrade, gradeX - 22, y + 18)

      doc.font('Helvetica').fontSize(9).fillColor(SLATE)
         .text(results.gradeLabel, gradeX - 30, y + 52, { width: 85, align: 'center' })

      // WAEC grade scale
      y = 265
      doc.font('Helvetica-Bold').fontSize(8).fillColor(SLATE)
         .text('WAEC GRADING SCALE', 50, y)
      y += 12

      const grades = [
        { g:'A1', r:'75-100%', c:'#D1FAE5', t:'#065F46' },
        { g:'B2', r:'70-74%',  c:'#D1FAE5', t:'#065F46' },
        { g:'B3', r:'65-69%',  c:'#D1FAE5', t:'#065F46' },
        { g:'C4', r:'60-64%',  c:LIGHT,     t:DARK      },
        { g:'C5', r:'55-59%',  c:LIGHT,     t:DARK      },
        { g:'C6', r:'50-54%',  c:LIGHT,     t:DARK      },
        { g:'D7', r:'45-49%',  c:'#FEF3C7', t:'#92400E' },
        { g:'E8', r:'40-44%',  c:'#FEF3C7', t:'#92400E' },
        { g:'F9', r:'0-39%',   c:'#FEE2E2', t:'#991B1B' },
      ]

      grades.forEach((g, i) => {
        const gx = 50 + i * 55
        const isThis = g.g === results.waecGrade
        doc.rect(gx, y, 52, 22)
           .fill(isThis ? TEAL : g.c)
           .stroke(isThis ? TEAL : '#E2E8F0')
        doc.font(isThis ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(8)
           .fillColor(isThis ? WHITE : g.t)
           .text(g.g, gx + 4, y + 3)
        doc.font('Helvetica').fontSize(6).fillColor(isThis ? '#CCFBF1' : SLATE)
           .text(g.r, gx + 1, y + 13)
      })

      // Section scores table
      y = 315
      y = sectionHeader('SECTION SCORES', y)

      const sections = [
        { name: 'Section A — Multiple Choice Questions', marks: results.sectionAMarks, total: 40, pct: Math.round((results.sectionAMarks/40)*100) },
        { name: 'Section B — Structured Questions',     marks: results.sectionBMarks, total: 40, pct: Math.round((results.sectionBMarks/40)*100) },
        { name: 'Section C — Essay Question',           marks: results.sectionCMarks, total: 20, pct: Math.round((results.sectionCMarks/20)*100) },
      ]

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

      // Section B review
      y = 50
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

      // Section C review
      if (y > 600) { doc.addPage(); y = 50 }
      y = sectionHeader('SECTION C — ESSAY QUESTION REVIEW', y)

      const essayAnswered = exam.sectionC.find(q => q.studentAnswer?.trim())
      if (essayAnswered) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
           .text(essayAnswered.topic || 'Essay', 58, y)
        doc.font('Helvetica').fontSize(8).fillColor(TEAL)
           .text(`${essayAnswered.marksAwarded ?? '—'}/20 marks`, 440, y, { width: 100, align: 'right' })
        y += 14

        if (essayAnswered.aiFeedback) {
          doc.font('Helvetica').fontSize(8).fillColor(SLATE)
             .text(essayAnswered.aiFeedback, 58, y, { width: 480, lineGap: 2 })
          y += doc.heightOfString(essayAnswered.aiFeedback, { width: 480 }) + 8
        }

        if (essayAnswered.partResults?.length > 0) {
          y = sectionHeader('ESSAY MARKING CRITERIA', y, SLATE)
          essayAnswered.partResults.forEach(cr => {
            if (y > 700) { doc.addPage(); y = 50 }
            doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK)
               .text(`${cr.name || cr.part}: ${cr.marksAwarded}/${cr.marksAvailable}m`, 58, y)
            doc.font('Helvetica').fontSize(8).fillColor(SLATE)
               .text(cr.feedback || '', 58, y + 10, { width: 480 })
            y += doc.heightOfString(cr.feedback || '', { width: 480 }) + 18
          })
        }
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
        `Review topics from ${subject} that were answered incorrectly in Section B.`,
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