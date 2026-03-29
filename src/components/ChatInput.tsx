import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  agentId: string
  agentName: string
  onSend: (agentId: string, message: string) => void
  isThinking: boolean
}

export default function ChatInput({
  agentId,
  agentName,
  onSend,
  isThinking,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (!isThinking) {
      inputRef.current?.focus()
    }
  }, [isThinking])

  const handleSend = () => {
    const text = message.trim()
    if (!text || isThinking) return
    onSend(agentId, text)
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation so WASD doesn't move the player
    e.stopPropagation()
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-agent-name">Chatting with {agentName}</div>
      {isThinking ? (
        <div className="thinking-indicator">Thinking...</div>
      ) : (
        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            data-testid="chat-input"
            type="text"
            placeholder={`Say something to ${agentName}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSend} disabled={!message.trim()}>
            Send
          </button>
        </div>
      )}
    </div>
  )
}
