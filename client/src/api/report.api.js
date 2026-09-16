import api from './client'

export const reportAPI = {
  getPreview: (examId) => api.get(`/reports/mock/${examId}`),

  // Download triggers a file save — needs special handling
  download: (examId) => {
    const token = sessionStorage.getItem('eduprepai_token')
    const url   = `/api/reports/mock/${examId}/download`

    // Fetch with auth header then trigger download
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        // fetch() never rejects on 4xx/5xx — without this check, a
        // JSON error body gets silently saved as a "PDF" that then
        // fails to open, with no error surfaced anywhere.
        if (!r.ok) {
          let message = 'Failed to generate report'
          try {
            const body = await r.json()
            message = body.message || message
          } catch { /* response wasn't JSON */ }
          throw new Error(message)
        }
        return r.blob()
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob)
        const link      = document.createElement('a')
        link.href       = objectUrl
        link.download   = `EduPrepAI_Report.pdf`
        link.click()
        URL.revokeObjectURL(objectUrl)
      })
  },
}