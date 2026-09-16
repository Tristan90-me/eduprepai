// ── pdfImageRenderer.utils.js ────────────────────────────────────
// Renders PDF pages to WebP images so the PDF extractor's AI call can
// actually see diagrams/figures instead of only reading whatever text
// happens to be extractable from the page.
//
// Uses pdfjs-dist directly (not the pdf-to-img wrapper) pinned to the
// exact version pdf-parse already depends on (5.4.296) — pdf-to-img
// bundles its own newer pdfjs-dist copy, and having two different
// pdfjs-dist versions active in the same process causes pdf.js's
// internal worker to mismatch ("API version X does not match Worker
// version Y"), breaking whichever of pdf-parse/pdf-to-img runs second.
// Sharing the one version pdf-parse already uses avoids that entirely.
//
// WebP, not JPEG or PNG: a real multi-page past paper produced 20-38MB
// responses with lossless PNG (measured live) — slow to generate, slow
// to transfer, and prone to client timeouts. JPEG cut that dramatically
// but its chroma-subsampled compression visibly fringes/discolours the
// hard black-on-white edges typical of line-art diagrams and text —
// exactly the content these pages mostly are — which showed up as a
// blue-ish tinge around edges once extracted. A side-by-side render of
// the same page confirmed WebP has neither problem: smaller than JPEG
// *and* clean edges, matching PNG's visual correctness. Both Gemini and
// Claude's vision APIs accept image/webp directly, and browser support
// for displaying it is universal at this point.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createCanvas } from '@napi-rs/canvas'

const WEBP_QUALITY = 0.85

// ── Render up to maxPages of a PDF buffer to WebP images ────────
// Returns [{ mimeType: 'image/webp', data: base64String }, ...] in
// page order (index 0 = page 1). Never throws — a rendering failure
// (unusual PDF structure, etc.) returns an empty array so callers can
// fall back to text-only extraction rather than failing the request.
export const renderPdfPagesToImages = async (buffer, { scale = 2, maxPages = 20 } = {}) => {
  try {
    const loadingTask = getDocument({ data: new Uint8Array(buffer) })
    const pdfDoc = await loadingTask.promise

    const images = []
    const pageCount = Math.min(pdfDoc.numPages, maxPages)

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDoc.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = createCanvas(viewport.width, viewport.height)
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport }).promise
      images.push({
        mimeType: 'image/webp',
        data: canvas.toBuffer('image/webp', WEBP_QUALITY).toString('base64'),
      })
    }

    return images
  } catch (err) {
    console.error('[pdfImageRenderer] Page rendering failed:', err.message)
    return []
  }
}

// Padding added around an AI-estimated bounding box before cropping —
// vision models won't return pixel-perfect boxes, so a little slack
// on each side avoids clipping the edge of a diagram or its labels.
const CROP_PADDING_FRACTION = 0.08
const CROP_WEBP_QUALITY = 0.9

// Crop one already-rendered high-res page canvas down to a bounding box.
// Pure/sync — no PDF or page access — so multiple questions that share a
// page can each get their own crop from the one shared render. Returns
// null for a missing/degenerate box; never throws.
const cropCanvasToBox = (fullCanvas, boundingBox) => {
  if (!boundingBox) return null
  const { x, y, width, height } = boundingBox
  if (![x, y, width, height].every(n => typeof n === 'number' && Number.isFinite(n))) return null
  if (width <= 0 || height <= 0) return null

  const padX = width  * CROP_PADDING_FRACTION
  const padY = height * CROP_PADDING_FRACTION
  const clamp01 = (n) => Math.max(0, Math.min(1, n))
  const x0 = clamp01(x - padX)
  const y0 = clamp01(y - padY)
  const x1 = clamp01(x + width  + padX)
  const y1 = clamp01(y + height + padY)

  const sx = Math.round(x0 * fullCanvas.width)
  const sy = Math.round(y0 * fullCanvas.height)
  const sw = Math.round((x1 - x0) * fullCanvas.width)
  const sh = Math.round((y1 - y0) * fullCanvas.height)
  if (sw < 10 || sh < 10) return null // degenerate box — not worth a crop

  const cropCanvas = createCanvas(sw, sh)
  const cropCtx = cropCanvas.getContext('2d')
  cropCtx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh)

  return {
    mimeType: 'image/webp',
    data: cropCanvas.toBuffer('image/webp', CROP_WEBP_QUALITY).toString('base64'),
  }
}

// ── Batch-crop diagrams for a whole extraction in one pass ─────────
// requests: [{ key, pageNumber, boundingBox }, ...] — one entry per
// diagram-dependent question. Returns a Map<key, crop | null>.
//
// Loads the PDF ONCE (not once per question) and renders each distinct
// page at high resolution ONCE, sequentially, reusing that single
// render for every question that crops from the same page. A past
// paper commonly has several questions referencing the same figure
// (e.g. three sub-questions about one diagram) — re-loading the whole
// PDF and re-rendering that page at high scale for each one, fully in
// parallel via Promise.all, was measured to make the whole server
// unresponsive/crash on real multi-diagram papers (surfaced to the
// client as an ECONNRESET, not a normal error response) once a paper
// had more than a handful of diagram questions. Rendering sequentially
// page-by-page keeps peak memory/CPU bounded regardless of how many
// questions reference diagrams.
export const renderPageCropsAtHighRes = async (buffer, requests, { scale = 3 } = {}) => {
  const results = new Map()
  if (!requests.length) return results

  try {
    const loadingTask = getDocument({ data: new Uint8Array(buffer) })
    const pdfDoc = await loadingTask.promise

    const byPage = new Map()
    for (const req of requests) {
      if (!byPage.has(req.pageNumber)) byPage.set(req.pageNumber, [])
      byPage.get(req.pageNumber).push(req)
    }

    for (const [pageNumber, reqs] of byPage) {
      let fullCanvas = null
      if (pageNumber >= 1 && pageNumber <= pdfDoc.numPages) {
        try {
          const page = await pdfDoc.getPage(pageNumber)
          const viewport = page.getViewport({ scale })
          fullCanvas = createCanvas(viewport.width, viewport.height)
          const ctx = fullCanvas.getContext('2d')
          await page.render({ canvasContext: ctx, viewport }).promise
        } catch (err) {
          console.error(`[pdfImageRenderer] Page ${pageNumber} high-res render failed:`, err.message)
          fullCanvas = null
        }
      }

      for (const req of reqs) {
        results.set(req.key, fullCanvas ? cropCanvasToBox(fullCanvas, req.boundingBox) : null)
      }
    }
  } catch (err) {
    console.error('[pdfImageRenderer] Crop batch failed:', err.message)
  }

  return results
}
