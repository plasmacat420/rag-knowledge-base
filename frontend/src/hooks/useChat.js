import { useState, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export function useChat(selectedDocIds) {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const sendMessage = useCallback(async (question) => {
    const userMsg = { id: Date.now(), role: 'user', content: question }
    const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: '', sources: [] }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInputValue('')
    setIsStreaming(true)

    try {
      const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          document_ids: selectedDocIds.length > 0 ? selectedDocIds : null,
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.token) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: m.content + data.token }
                    : m
                )
              )
            }
            if (data.done && data.sources) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, sources: data.sources } : m
                )
              )
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: 'Error: Failed to get response. Please try again.' }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }, [selectedDocIds])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, isStreaming, sendMessage, inputValue, setInputValue, clearMessages }
}
