import { useEffect, useRef } from 'react'
import { Agent, Position } from '../types'
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_SIZE,
  PLAYER_SPEED,
  INTERACTION_RANGE,
  PLAYER_START,
  getAgentPosition,
  getCollisionRects,
} from './layout'

interface UseGameLoopArgs {
  playerRef: React.RefObject<HTMLDivElement | null>
  worldRef: React.RefObject<HTMLDivElement | null>
  viewportRef: React.RefObject<HTMLDivElement | null>
  agents: Agent[]
  onNearbyAgentChange: (agentId: string | null) => void
}

export function useGameLoop({
  playerRef,
  worldRef,
  viewportRef,
  agents,
  onNearbyAgentChange,
}: UseGameLoopArgs) {
  const posRef = useRef<Position>({ ...PLAYER_START })
  const keysRef = useRef<Set<string>>(new Set())
  const nearbyRef = useRef<string | null>(null)
  const walkTargetRef = useRef<Position | null>(null)
  const agentsRef = useRef(agents)
  const onNearbyChangeRef = useRef(onNearbyAgentChange)

  // Keep refs current without re-triggering the effect
  agentsRef.current = agents
  onNearbyChangeRef.current = onNearbyAgentChange

  const walkTo = (target: Position) => {
    walkTargetRef.current = target
  }

  useEffect(() => {
    const collisionRects = getCollisionRects()

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    let frameId: number

    const loop = () => {
      const keys = keysRef.current
      let dx = 0
      let dy = 0

      const pos = posRef.current

      const hasKeyInput =
        keys.has('w') || keys.has('W') || keys.has('ArrowUp') ||
        keys.has('s') || keys.has('S') || keys.has('ArrowDown') ||
        keys.has('a') || keys.has('A') || keys.has('ArrowLeft') ||
        keys.has('d') || keys.has('D') || keys.has('ArrowRight')

      // Keyboard input cancels walk target
      if (hasKeyInput) {
        walkTargetRef.current = null
      }

      if (hasKeyInput) {
        if (keys.has('w') || keys.has('W') || keys.has('ArrowUp')) dy -= 1
        if (keys.has('s') || keys.has('S') || keys.has('ArrowDown')) dy += 1
        if (keys.has('a') || keys.has('A') || keys.has('ArrowLeft')) dx -= 1
        if (keys.has('d') || keys.has('D') || keys.has('ArrowRight')) dx += 1

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
          dx *= 0.707
          dy *= 0.707
        }
      } else if (walkTargetRef.current) {
        // Auto-walk toward target
        const target = walkTargetRef.current
        const tdx = target.x - pos.x
        const tdy = target.y - pos.y
        const dist = Math.sqrt(tdx * tdx + tdy * tdy)

        if (dist < INTERACTION_RANGE * 0.8) {
          // Arrived — stop walking
          walkTargetRef.current = null
        } else {
          dx = tdx / dist
          dy = tdy / dist
        }
      }

      dx *= PLAYER_SPEED
      dy *= PLAYER_SPEED
      const half = PLAYER_SIZE / 2
      const prevX = pos.x
      const prevY = pos.y

      // Try X axis
      const newX = pos.x + dx
      const playerRectX = {
        x: newX - half,
        y: pos.y - half,
        w: PLAYER_SIZE,
        h: PLAYER_SIZE,
      }

      let xBlocked =
        newX - half < 0 || newX + half > WORLD_WIDTH

      if (!xBlocked) {
        for (const rect of collisionRects) {
          if (
            playerRectX.x < rect.x + rect.w &&
            playerRectX.x + playerRectX.w > rect.x &&
            playerRectX.y < rect.y + rect.h &&
            playerRectX.y + playerRectX.h > rect.y
          ) {
            xBlocked = true
            break
          }
        }
      }

      if (!xBlocked) {
        pos.x = newX
      }

      // Try Y axis
      const newY = pos.y + dy
      const playerRectY = {
        x: pos.x - half,
        y: newY - half,
        w: PLAYER_SIZE,
        h: PLAYER_SIZE,
      }

      let yBlocked =
        newY - half < 0 || newY + half > WORLD_HEIGHT

      if (!yBlocked) {
        for (const rect of collisionRects) {
          if (
            playerRectY.x < rect.x + rect.w &&
            playerRectY.x + playerRectY.w > rect.x &&
            playerRectY.y < rect.y + rect.h &&
            playerRectY.y + playerRectY.h > rect.y
          ) {
            yBlocked = true
            break
          }
        }
      }

      if (!yBlocked) {
        pos.y = newY
      }

      // Update player DOM position
      const playerEl = playerRef.current
      if (playerEl) {
        playerEl.style.transform = `translate(${pos.x - half}px, ${pos.y - half}px)`
        const moved = pos.x !== prevX || pos.y !== prevY
        playerEl.classList.toggle('walking', moved)
      }

      // Update camera
      const viewportEl = viewportRef.current
      const worldEl = worldRef.current
      if (viewportEl && worldEl) {
        const vw = viewportEl.clientWidth
        const vh = viewportEl.clientHeight

        let camX = -(pos.x - vw / 2)
        let camY = -(pos.y - vh / 2)

        // Clamp to world edges
        camX = Math.min(0, Math.max(camX, -(WORLD_WIDTH - vw)))
        camY = Math.min(0, Math.max(camY, -(WORLD_HEIGHT - vh)))

        worldEl.style.transform = `translate(${camX}px, ${camY}px)`
      }

      // Check nearby agent
      let closestId: string | null = null
      let closestDist = INTERACTION_RANGE

      for (const agent of agentsRef.current) {
        const agentPos = getAgentPosition(agent.deskIndex)
        const adx = pos.x - agentPos.x
        const ady = pos.y - agentPos.y
        const dist = Math.sqrt(adx * adx + ady * ady)
        if (dist < closestDist) {
          closestDist = dist
          closestId = agent.id
        }
      }

      if (closestId !== nearbyRef.current) {
        nearbyRef.current = closestId
        onNearbyChangeRef.current(closestId)
      }

      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(frameId)
    }
  }, [playerRef, worldRef, viewportRef])

  return { posRef, walkTo }
}
