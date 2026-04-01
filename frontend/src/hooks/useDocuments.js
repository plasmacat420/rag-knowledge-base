import { useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/documents')
      setDocuments(res.data.documents)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const uploadDocument = useCallback(async (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })
    return res.data
  }, [])

  const deleteDocument = useCallback(async (id) => {
    await apiClient.delete(`/documents/${id}`)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { documents, loading, error, uploadDocument, deleteDocument, refetch }
}
