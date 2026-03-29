import { useRef } from 'react'
import { Agent, Bubble } from '../types'
import { DESKS, AGENT_SIZE, PLAYER_SIZE, PLAYER_START, WALL_THICKNESS, WORLD_WIDTH, WORLD_HEIGHT, getAgentPosition } from '../game/layout'
import { useGameLoop } from '../game/useGameLoop'

interface GameWorldProps {
  agents: Agent[]
  bubbles: Bubble[]
  nearbyAgentId: string | null
  onNearbyAgentChange: (agentId: string | null) => void
}

export default function GameWorld({
  agents,
  bubbles,
  nearbyAgentId,
  onNearbyAgentChange,
}: GameWorldProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const { walkTo } = useGameLoop({
    playerRef,
    worldRef,
    viewportRef,
    agents,
    onNearbyAgentChange,
  })

  const handleAgentDoubleClick = (deskIndex: number) => {
    const target = getAgentPosition(deskIndex)
    walkTo(target)
  }

  return (
    <div ref={viewportRef} className="viewport">
      <div ref={worldRef} className="world">
        <div className="floor" />

        {/* Walls */}
        <div className="wall wall-top" />
        <div className="wall wall-bottom" />
        <div className="wall wall-left" />
        <div className="wall wall-right" />

        <div className="room-label">AgentSpace HQ</div>

        {/* Desks */}
        {DESKS.map((desk, i) => (
          <div
            className="desk"
            key={i}
            style={{ left: desk.x, top: desk.y }}
          >
            <div className="desk-surface">
              <div className="desk-monitor">
                <div className="desk-screen" />
              </div>
            </div>
          </div>
        ))}

        {/* Agents */}
        {agents.map((agent) => {
          const pos = getAgentPosition(agent.deskIndex)
          const bubble = bubbles.find((b) => b.agentId === agent.id)
          const half = AGENT_SIZE / 2
          return (
            <div
              className="agent"
              key={agent.id}
              style={{
                transform: `translate(${pos.x - half}px, ${pos.y - half}px)`,
                cursor: 'pointer',
              }}
              data-agent-id={agent.id}
              onDoubleClick={() => handleAgentDoubleClick(agent.deskIndex)}
            >
              <div
                className="agent-avatar"
                style={{ '--avatar-color': agent.color } as React.CSSProperties}
              >
                <div className="sprite-head" />
                <div className="sprite-body" />
                <div className="sprite-legs">
                  <div className="sprite-leg" />
                  <div className="sprite-leg" />
                </div>
              </div>
              <div className="agent-name">{agent.name}</div>
              {bubble && (
                <div className="bubble" data-testid={`bubble-${agent.id}`}>
                  {bubble.message}
                </div>
              )}
            </div>
          )
        })}

        {/* Player */}
        <div
          ref={playerRef}
          className="player"
          style={{
            transform: `translate(${PLAYER_START.x - PLAYER_SIZE / 2}px, ${PLAYER_START.y - PLAYER_SIZE / 2}px)`,
          }}
        >
          <div className="player-avatar">
            <div className="sprite-head" />
            <div className="sprite-body" />
            <div className="sprite-legs">
              <div className="sprite-leg" />
              <div className="sprite-leg" />
            </div>
          </div>
          <div className="player-name">You</div>
        </div>
      </div>
    </div>
  )
}
