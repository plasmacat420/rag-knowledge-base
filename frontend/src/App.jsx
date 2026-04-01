import { useState, useEffect } from 'react'
import { Github, Info, X } from 'lucide-react'
import UploadPanel from './components/UploadPanel'
import DocumentList from './components/DocumentList'
import ChatPanel from './components/ChatPanel'
import { useDocuments } from './hooks/useDocuments'

export default function App() {
  const [selectedDocIds, setSelectedDocIds] = useState([])
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [backendOnline, setBackendOnline] = useState(null)
  const { documents, loading, uploadDocument, deleteDocument, refetch } = useDocuments()

  useEffect(() => {
    fetch('/api/health')
      .then((r) => setBackendOnline(r.ok))
      .catch(() => setBackendOnline(false))
  }, [])

  const toggleDoc = (id) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  const handleDelete = async (id) => {
    await deleteDocument(id)
    setSelectedDocIds((prev) => prev.filter((d) => d !== id))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Demo banner */}
      {backendOnline === false && !bannerDismissed && (
        <div className="bg-amber-950/60 border-b border-amber-800/50 px-4 py-2.5 flex items-center gap-3 text-sm text-amber-300">
          <Info size={15} className="flex-shrink-0" />
          <span className="flex-1">
            <strong>Live demo — frontend only.</strong> The backend (FastAPI + ChromaDB + OpenAI) runs locally.{' '}
            <a
              href="https://github.com/plasmacat420/rag-knowledge-base#quick-start"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-100"
            >
              See setup instructions →
            </a>
          </span>
          <button onClick={() => setBannerDismissed(true)} className="text-amber-500 hover:text-amber-200 flex-shrink-0">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-white">RAG Knowledge Base</h1>
          <p className="text-xs text-gray-400 mt-0.5">Chat with your documents</p>
        </div>
        <a
          href="https://github.com/plasmacat420/rag-knowledge-base"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <Github size={18} />
          <span className="hidden sm:inline">View on GitHub</span>
        </a>
      </header>

      {/* Main content */}
      <main className="flex flex-col md:flex-row flex-1 gap-0 overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>
        {/* Left column */}
        <div className="w-full md:w-2/5 flex flex-col border-r border-gray-800 overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <UploadPanel onUpload={uploadDocument} onSuccess={refetch} />
          </div>
          <div className="p-4 flex-1">
            <DocumentList
              documents={documents}
              loading={loading}
              selectedDocIds={selectedDocIds}
              onToggle={toggleDoc}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="w-full md:w-3/5 flex flex-col overflow-hidden">
          <ChatPanel selectedDocIds={selectedDocIds} />
        </div>
      </main>
    </div>
  )
}
