import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

export default function SourceCard({ source }) {
  const [expanded, setExpanded] = useState(false)
  const preview = source.content.slice(0, 200)
  const hasMore = source.content.length > 200

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg text-xs overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={12} className="text-gray-500 flex-shrink-0" />
          <span className="text-gray-300 truncate font-medium">{source.filename}</span>
          <span className="text-gray-600 flex-shrink-0">chunk {source.chunk_index}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-green-400 font-medium">{Math.round(source.score * 100)}%</span>
          {expanded ? <ChevronUp size={12} className="text-gray-500" /> : <ChevronDown size={12} className="text-gray-500" />}
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1 text-gray-400 leading-relaxed border-t border-gray-700/50">
          {expanded && !hasMore ? source.content : preview}
          {hasMore && !expanded && '...'}
        </div>
      )}
    </div>
  )
}
