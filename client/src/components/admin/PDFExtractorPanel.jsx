import { useState, useRef } from 'react'
import { adminAPI } from '../../api/admin.api'
import QuestionPreviewTable from './QuestionPreviewTable'
import { FileSearch, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

const SUBJECTS = [
  'Mathematics', 'English Language', 'Integrated Science', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Economics',
]

export default function PDFExtractorPanel() {
  const fileRef = useRef(null)

  const [meta,     setMeta]     = useState({ subject: 'Mathematics', examType: 'WASSCE', year: 2023 })
  const [file,     setFile]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [previews, setPreviews] = useState(null)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (f.type !== 'application/pdf')     return toast.error('Please upload a PDF file')
    if (f.size > 10 * 1024 * 1024)        return toast.error('File too large — max 10MB')
    setFile(f)
  }

  const handleExtract = async () => {
    if (!file) return toast.error('Please select a PDF first')
    setLoading(true)
    setPreviews(null)
    try {
      // Convert PDF to base64 for transport over JSON
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result.split(',')[1])
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      const data = await adminAPI.extractFromPDF({
        pdfBase64: base64,
        subject:   meta.subject,
        examType:  meta.examType,
        year:      Number(meta.year),
      })

      setPreviews(data.previews)
      toast.success(`${data.count} questions extracted — review below`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approved) => {
    try {
      const data = await adminAPI.approveQuestions(approved)
      toast.success(data.message)
      setPreviews(null)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <FileSearch className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3
            className="font-semibold text-slate-800"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            PDF Question Extractor
          </h3>
          <p className="text-sm text-slate-500">
            Upload a past paper PDF — Gemini extracts all questions automatically
          </p>
        </div>
      </div>

      {!previews && (
        <div className="card space-y-4">

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Subject</label>
              <select
                value={meta.subject}
                onChange={e => setMeta(p => ({ ...p, subject: e.target.value }))}
                className="input"
              >
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Exam type</label>
              <select
                value={meta.examType}
                onChange={e => setMeta(p => ({ ...p, examType: e.target.value }))}
                className="input"
              >
                <option>WASSCE</option>
                <option>BECE</option>
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input
                type="number" value={meta.year}
                onChange={e => setMeta(p => ({ ...p, year: e.target.value }))}
                min={2010} max={2025} className="input"
              />
            </div>
          </div>

          {/* File upload dropzone */}
          <div>
            <label className="label">Past paper PDF</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-teal-400 bg-teal-50'
                  : 'border-slate-200 hover:border-teal-300'
              }`}
            >
              {file ? (
                <div>
                  <p className="text-teal-700 font-medium text-sm">📄 {file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(file.size / 1024).toFixed(0)} KB · Click to change
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Click to upload or drag a PDF here</p>
                  <p className="text-xs text-slate-400 mt-1">Max 10MB · Text-based PDFs only</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-800 mb-1">Tips for best results</p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
              <li>Use PDFs downloaded from official sources, not scanned images</li>
              <li>One subject paper per upload works best</li>
              <li>Always review extracted questions before saving</li>
            </ul>
          </div>

          <button
            onClick={handleExtract}
            disabled={!file || loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading
              ? <><span className="spinner border-white/40 border-t-white" /> Extracting questions…</>
              : <><FileSearch className="w-4 h-4" /> Extract questions from PDF</>
            }
          </button>
        </div>
      )}

      {previews && (
        <QuestionPreviewTable
          previews={previews}
          onApprove={handleApprove}
          onCancel={() => setPreviews(null)}
        />
      )}
    </div>
  )
}