export interface Agent {
  id: string
  name: string
  webhookUrl: string
  color: string
  deskIndex: number
}

export interface Position {
  x: number
  y: number
}

export interface Bubble {
  agentId: string
  message: string
  expiresAt: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
