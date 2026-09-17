import { useState, useEffect } from 'react'
import { ImageOff } from 'lucide-react'
import { questionAPI } from '../api/question.api'

// ── Detect image format from the base64 signature ────────────────
// imageData has been saved in more than one format over time (PNG
// early on, briefly JPEG, now WebP) — sniffing the actual bytes
// rather than assuming a fixed MIME type means every already-saved
// image keeps rendering correctly regardless of which format it was
// saved in, with no migration needed.
const detectMimeType = (base64) => {
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png'
  if (base64.startsWith('/9j/'))        return 'image/jpeg'
  if (base64.startsWith('UklGR'))       return 'image/webp'
  return 'image/png' // fallback — browsers sniff actual bytes anyway
}

// ── QuestionDiagram ──────────────────────────────────────────────
// Renders a question's diagram/figure, if it has one. Two modes:
// - `imageData` passed directly (admin preview/review, before a
//   question is even saved — already in the payload, no fetch needed)
// - `questionId` + `hasImage` (practice/mock exam — batch fetches
//   exclude imageData to stay light, so this lazily fetches it only
//   when a diagram-flagged question is actually being displayed)
export default function QuestionDiagram({ questionId, hasImage, imageData }) {
  const [fetchedImage, setFetchedImage] = useState(imageData || null)
  const [loading, setLoading] = useState(false)
  const [failed,  setFailed]  = useState(false)

  useEffect(() => {
    if (imageData || !hasImage || !questionId) return
    setLoading(true)
    setFailed(false)
    questionAPI.getImage(questionId)
      .then(data => setFetchedImage(data.imageData || null))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, hasImage, imageData])

  if (!hasImage) return null

  if (loading) {
    return (
      <div className="mb-5 h-40 rounded-xl bg-slate-100 animate-pulse flex items-center justify-center">
        <span className="text-xs text-slate-400">Loading diagram…</span>
      </div>
    )
  }

  if (failed || !fetchedImage) {
    return (
      <div className="mb-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 flex items-center gap-2 text-xs text-slate-400">
        <ImageOff className="w-4 h-4 flex-shrink-0" />
        This question references a diagram that couldn't be loaded.
      </div>
    )
  }

  return (
    <div className="mb-5">
      <img
        src={`data:${detectMimeType(fetchedImage)};base64,${fetchedImage}`}
        alt="Question diagram"
        // Capped, not full-width — this is now a focused crop of just
        // the figure, not a whole page. Stretching a small crop to
        // fill a wide card would blow it up and look blurry again.
        className="rounded-xl border border-slate-200 max-w-md w-full mx-auto block"
      />
    </div>
  )
}
