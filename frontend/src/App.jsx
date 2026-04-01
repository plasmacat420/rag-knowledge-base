import { useState } from 'react'
import { Github } from 'lucide-react'
import UploadPanel from './components/UploadPanel'
import DocumentList from './components/DocumentList'
import ChatPanel from './components/ChatPanel'
import { useDocuments } from './hooks/useDocuments'

export default function App() {
  const [selectedDocIds, setSelectedDocIds] = useState([])
  const { documents, loading, uploadDocument, deleteDocument, refetch } = useDocuments()

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
