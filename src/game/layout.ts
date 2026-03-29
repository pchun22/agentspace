import { Position, Rect } from '../types'

export const WORLD_WIDTH = 1408
export const WORLD_HEIGHT = 896
export const PLAYER_SIZE = 32
export const AGENT_SIZE = 32
export const PLAYER_SPEED = 2
export const INTERACTION_RANGE = 130
export const DESK_WIDTH = 128
export const DESK_HEIGHT = 64
export const WALL_THICKNESS = 32

export const DESKS: Position[] = [
  { x: 192, y: 192 },
  { x: 544, y: 192 },
  { x: 928, y: 224 },
]

export const PLAYER_START: Position = { x: 704, y: 640 }

/** Returns the center position of an agent sitting behind (north of) their desk. */
export function getAgentPosition(deskIndex: number): Position {
  const desk = DESKS[deskIndex]
  if (!desk) return { x: 0, y: 0 }
  return {
    x: desk.x + DESK_WIDTH / 2,
    y: desk.y - 32,
  }
}

/** Returns collision rects for all desks plus boundary walls. */
export function getCollisionRects(): Rect[] {
  const deskRects = DESKS.map((desk) => ({
    x: desk.x,
    y: desk.y,
    w: DESK_WIDTH,
    h: DESK_HEIGHT,
  }))

  const wallRects: Rect[] = [
    { x: 0, y: 0, w: WORLD_WIDTH, h: WALL_THICKNESS },
    { x: 0, y: WORLD_HEIGHT - WALL_THICKNESS, w: WORLD_WIDTH, h: WALL_THICKNESS },
    { x: 0, y: WALL_THICKNESS, w: WALL_THICKNESS, h: WORLD_HEIGHT - 2 * WALL_THICKNESS },
    { x: WORLD_WIDTH - WALL_THICKNESS, y: WALL_THICKNESS, w: WALL_THICKNESS, h: WORLD_HEIGHT - 2 * WALL_THICKNESS },
  ]

  return [...deskRects, ...wallRects]
}
