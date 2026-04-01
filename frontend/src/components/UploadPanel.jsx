import { useRef, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function UploadPanel({ onUpload, onSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'txt'].includes(ext)) {
      setStatus('error')
      setMessage('Only .pdf and .txt files are supported.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error')
      setMessage('File exceeds 10MB limit.')
      return
    }

    setUploading(true)
    setStatus(null)
    setProgress(0)

    try {
      await onUpload(file, (pct) => setProgress(pct))
      setStatus('success')
      setMessage(`"${file.name}" uploaded successfully!`)
      onSuccess?.()
    } catch (err) {
      setStatus('error')
      setMessage(err?.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Upload Document</h2>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-500 bg-blue-950/20' : 'border-gray-700 hover:border-gray-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-blue-400" />
            <span className="text-sm text-gray-400">Uploading...</span>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-gray-500" />
            <span className="text-sm text-gray-400">
              Drag & drop or <span className="text-blue-400">click to browse</span>
            </span>
            <span className="text-xs text-gray-600">PDF, TXT — max 10MB</span>
          </div>
        )}
      </div>

      {status && (
        <div className={`mt-2 flex items-center gap-2 text-sm rounded px-3 py-2 ${
          status === 'success' ? 'bg-green-950/40 text-green-400' : 'bg-red-950/40 text-red-400'
        }`}>
          {status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {message}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}
