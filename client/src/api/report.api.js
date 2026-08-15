import api from './client'

export const reportAPI = {
  getPreview: (examId) => api.get(`/reports/mock/${examId}`),

  // Download triggers a file save — needs special handling
  download: (examId) => {
    const token = localStorage.getItem('eduprepai_token')
    const url   = `/api/reports/mock/${examId}/download`
    const link  = document.createElement('a')
    link.href   = url

    // Fetch with auth header then trigger download
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob)
        link.href       = objectUrl
        link.download   = `EduPrepAI_Report.pdf`
        link.click()
        URL.revokeObjectURL(objectUrl)
      })
  },
}