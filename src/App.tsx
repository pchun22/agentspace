import { useState, useEffect, useCallback } from 'react'
import type { Agent, Bubble } from './types'
import GameWorld from './components/GameWorld'
import AddAgentModal from './components/AddAgentModal'
import ChatInput from './components/ChatInput'

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [nearbyAgentId, setNearbyAgentId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [thinkingAgentId, setThinkingAgentId] = useState<string | null>(null)

  // Fetch existing agents on mount
  useEffect(() => {
    fetch('/api/agents')
      .then((res) => res.json())
      .then((data) => setAgents(data))
      .catch((err) => console.error('Failed to fetch agents:', err))
  }, [])

  // Connect to SSE for real-time events
  useEffect(() => {
    const eventSource = new EventSource('/api/events')

    eventSource.addEventListener('agent-added', (e) => {
      const agent: Agent = JSON.parse(e.data)
      setAgents((prev) => {
        if (prev.some((a) => a.id === agent.id)) return prev
        return [...prev, agent]
      })
    })

    eventSource.addEventListener('agent-response', (e) => {
      const data = JSON.parse(e.data)
      const bubble: Bubble = {
        agentId: data.agentId,
        message: data.message,
        expiresAt: Date.now() + 8000,
      }
      setBubbles((prev) => [...prev, bubble])
      setThinkingAgentId(null)
    })

    return () => eventSource.close()
  }, [])

  // Clean up expired bubbles every second
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) => {
        const now = Date.now()
        const filtered = prev.filter((b) => b.expiresAt > now)
        return filtered.length === prev.length ? prev : filtered
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const sendMessage = useCallback(
    (agentId: string, message: string) => {
      setThinkingAgentId(agentId)
      fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, message }),
      }).catch((err) => {
        console.error('Failed to send message:', err)
        setThinkingAgentId(null)
      })
    },
    []
  )

  const nearbyAgent = nearbyAgentId
    ? agents.find((a) => a.id === nearbyAgentId) ?? null
    : null

  return (
    <>
      <GameWorld
        agents={agents}
        bubbles={bubbles}
        nearbyAgentId={nearbyAgentId}
        onNearbyAgentChange={setNearbyAgentId}
      />

      <button
        className="add-agent-btn"
        onClick={() => setShowAddModal(true)}
      >
        + Add Agent
      </button>

      {showAddModal && (
        <AddAgentModal onClose={() => setShowAddModal(false)} />
      )}

      {nearbyAgent && (
        <ChatInput
          agentId={nearbyAgent.id}
          agentName={nearbyAgent.name}
          onSend={sendMessage}
          isThinking={thinkingAgentId === nearbyAgent.id}
        />
      )}
    </>
  )
}
