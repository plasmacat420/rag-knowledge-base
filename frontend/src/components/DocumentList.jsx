import { Trash2, FileText, Loader2 } from 'lucide-react'

export default function DocumentList({ documents, loading, selectedDocIds, onToggle, onDelete }) {
  if (loading) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Documents</h2>
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-gray-800 rounded-lg mb-2 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Documents {documents.length > 0 && <span className="text-gray-500 font-normal">({documents.length})</span>}
      </h2>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No documents yet.</p>
          <p className="text-xs mt-1">Upload a PDF or text file to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedDocIds.includes(doc.id)
                  ? 'border-blue-500 bg-blue-950/20'
                  : 'border-gray-800 hover:border-gray-700 bg-gray-900/50'
              }`}
              onClick={() => onToggle(doc.id)}
            >
              <input
                type="checkbox"
                checked={selectedDocIds.includes(doc.id)}
                onChange={() => onToggle(doc.id)}
                onClick={(e) => e.stopPropagation()}
                className="accent-blue-500"
              />
              <FileText size={16} className="text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{doc.filename}</p>
                <p className="text-xs text-gray-500">{doc.chunk_count} chunks</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}
                className="text-gray-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                title="Delete document"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {documents.length > 0 && (
            <p className="text-xs text-gray-600 text-center pt-1">
              {selectedDocIds.length === 0
                ? 'Select documents to filter, or query all'
                : `Querying ${selectedDocIds.length} selected`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
