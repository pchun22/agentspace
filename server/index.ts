import express from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'

const app = express()
app.use(cors())
app.use(express.json())

interface Agent {
  id: string
  name: string
  webhookUrl: string
  color: string
  deskIndex: number
}

const COLORS = ['#4A90D9', '#E85D75', '#4AD97A', '#E8B84A', '#9B6BD9', '#E8884A']

const agents = new Map<string, Agent>()
let nextDeskIndex = 0

// SSE connections
const sseClients = new Set<express.Response>()

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write('\n')
  sseClients.add(res)
  req.on('close', () => sseClients.delete(res))
})

function broadcast(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  sseClients.forEach((client) => client.write(msg))
}

// Add agent
app.post('/api/agents', (req, res) => {
  const { name, webhookUrl } = req.body
  if (!name || !webhookUrl) {
    res.status(400).json({ error: 'name and webhookUrl required' })
    return
  }
  const agent: Agent = {
    id: randomUUID(),
    name,
    webhookUrl,
    color: COLORS[nextDeskIndex % COLORS.length],
    deskIndex: nextDeskIndex++,
  }
  agents.set(agent.id, agent)
  broadcast('agent-added', agent)
  res.json(agent)
})

// List agents
app.get('/api/agents', (_req, res) => {
  res.json([...agents.values()])
})

// Send message to agent
app.post('/api/send-message', async (req, res) => {
  const { agentId, message } = req.body
  const agent = agents.get(agentId)
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' })
    return
  }

  try {
    const webhookRes = await fetch(agent.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        message,
        response: {
          url: `${process.env.PUBLIC_URL || 'http://localhost:3001'}/api/agent-response`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { agentId, message: '{{your response here}}' },
        },
      }),
    })

    // Try to extract a synchronous response from the webhook
    const contentType = webhookRes.headers.get('content-type') || ''
    let responseMessage: string | null = null

    if (contentType.includes('application/json')) {
      const data = await webhookRes.json() as Record<string, unknown>
      responseMessage = (data.message ?? data.text ?? data.response ?? data.content) as string | null

      // Handle nested output structures (e.g. Tasklet's { output: { message } })
      if (!responseMessage && typeof data.output === 'object' && data.output !== null) {
        const out = data.output as Record<string, unknown>
        responseMessage = (out.message ?? out.text ?? out.response ?? out.content) as string | null
      }
    } else {
      const text = await webhookRes.text()
      if (text && text.length > 0 && text.length < 2000) {
        responseMessage = text
      }
    }

    if (responseMessage) {
      console.log(`Sync response from ${agent.name}: ${responseMessage}`)
      broadcast('agent-response', { agentId, message: responseMessage })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(502).json({ error: 'Failed to reach agent webhook' })
  }
})

// Receive response from agent
app.post('/api/agent-response', (req, res) => {
  const { agentId, message } = req.body
  console.log(`Agent response from ${agentId}: ${message}`)
  broadcast('agent-response', { agentId, message })
  res.json({ ok: true })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`AgentSpace server running on http://localhost:${PORT}`)
})
