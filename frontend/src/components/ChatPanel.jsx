import { useEffect, useRef } from 'react'
import { Send, MessageSquare, Loader2 } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import SourceCard from './SourceCard'

export default function ChatPanel({ selectedDocIds }) {
  const { messages, isStreaming, sendMessage, inputValue, setInputValue } = useChat(selectedDocIds)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isStreaming) return
    sendMessage(inputValue.trim())
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
            <MessageSquare size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Upload a document and ask a question</p>
            <p className="text-xs mt-1">Answers will be grounded in your documents</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content || (msg.role === 'assistant' && isStreaming && (
                    <Loader2 size={14} className="animate-spin" />
                  ))}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="space-y-1 w-full">
                    <p className="text-xs text-gray-500 px-1">Sources:</p>
                    {msg.sources.map((src, i) => (
                      <SourceCard key={i} source={src} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isStreaming ? 'Generating...' : 'Ask a question about your documents...'}
            disabled={isStreaming}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 transition-colors"
          >
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  )
}
