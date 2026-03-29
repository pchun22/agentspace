import { test, expect } from '@playwright/test'

test.describe('basic UI', () => {
  test('app loads and shows empty office', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.viewport')).toBeVisible()
    await expect(page.locator('.world')).toBeVisible()
    await expect(page.locator('.player')).toBeVisible()
    await expect(page.locator('.desk')).toHaveCount(3)
  })

  test('can add an agent via UI', async ({ page }) => {
    await page.goto('/')

    // Open modal
    await page.click('.add-agent-btn')
    await expect(page.locator('.modal-card')).toBeVisible()

    // Fill form
    await page.fill('[data-testid="agent-name-input"]', 'TestBot')
    await page.fill(
      '[data-testid="agent-webhook-input"]',
      'https://example.com/webhook'
    )

    // Submit
    await page.click('[data-testid="add-agent-submit"]')

    // Agent appears in the world
    const agent = page.locator('.agent')
    await expect(agent).toHaveCount(1, { timeout: 5000 })
    await expect(agent.locator('.agent-name')).toHaveText('TestBot')

    // Modal closes
    await expect(page.locator('.modal-card')).not.toBeVisible()
  })

  test('player can move with arrow keys', async ({ page }) => {
    await page.goto('/')

    // Wait for player to render
    const player = page.locator('.player')
    await expect(player).toBeVisible()

    // Get initial transform
    const initialTransform = await player.evaluate(
      (el) => el.style.transform
    )

    // Press ArrowRight for 500ms
    await page.keyboard.down('ArrowRight')
    await page.waitForTimeout(500)
    await page.keyboard.up('ArrowRight')

    // Small settle time for the animation frame to apply
    await page.waitForTimeout(50)

    const newTransform = await player.evaluate((el) => el.style.transform)

    expect(newTransform).not.toBe(initialTransform)

    // Parse x values to confirm rightward movement
    const parseX = (t: string) => {
      const match = t.match(/translate\(([\d.]+)px/)
      return match ? parseFloat(match[1]) : 0
    }

    expect(parseX(newTransform)).toBeGreaterThan(parseX(initialTransform))
  })

  test('chat input appears when near agent', async ({ page }) => {
    await page.goto('/')

    // Add agent at desk 0 via API (desk 0 is at x:200, y:200; agent sits at x:260, y:170)
    const res = await page.request.post('/api/agents', {
      data: { name: 'DeskBot', webhookUrl: 'https://example.com/webhook' },
    })
    expect(res.ok()).toBeTruthy()

    // Wait for agent to appear via SSE
    await expect(page.locator('.agent')).toHaveCount(1, { timeout: 5000 })

    // Player starts at (700, 650). Agent is at roughly (260, 170).
    // We need to move up and left. At PLAYER_SPEED=4 per frame (~60fps),
    // that is ~240px/sec. We need ~440px left and ~480px up.
    // Hold both keys for about 2.5 seconds to cover the distance.
    await page.keyboard.down('ArrowUp')
    await page.keyboard.down('ArrowLeft')
    await page.waitForTimeout(3000)
    await page.keyboard.up('ArrowUp')
    await page.keyboard.up('ArrowLeft')

    // Chat input should appear once player is within INTERACTION_RANGE (100px) of agent
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({
      timeout: 3000,
    })
  })
})

test.describe('integration', () => {
  // These tests require the real webhook agents to be running on localhost:3102.
  // Run with: npx playwright test --grep integration
  // Skip by default when agents are not available.

  test.beforeEach(async ({ page }) => {
    // Quick check: is the webhook server reachable?
    try {
      const res = await page.request.head(
        'https://localhost:3102/v1/public/webhook?token=02532f1143e0ad8509bd5bddfc1664ef',
        { ignoreHTTPSErrors: true, timeout: 3000 }
      )
      if (!res.ok() && res.status() !== 405) {
        test.skip(true, 'Webhook server not reachable')
      }
    } catch {
      test.skip(true, 'Webhook server not reachable')
    }
  })

  test('full message flow — send message and receive bubble', async ({
    page,
  }) => {
    await page.goto('/')

    // Add agent with real webhook
    const agentRes = await page.request.post('/api/agents', {
      data: {
        name: 'RealAgent',
        webhookUrl:
          'https://localhost:3102/v1/public/webhook?token=02532f1143e0ad8509bd5bddfc1664ef',
      },
    })
    expect(agentRes.ok()).toBeTruthy()
    const agent = await agentRes.json()
    const agentId: string = agent.id

    // Wait for agent to appear via SSE
    await expect(
      page.locator(`.agent[data-agent-id="${agentId}"]`)
    ).toBeVisible({ timeout: 5000 })

    // Move player near agent (desk 0)
    await page.keyboard.down('ArrowUp')
    await page.keyboard.down('ArrowLeft')
    await page.waitForTimeout(3000)
    await page.keyboard.up('ArrowUp')
    await page.keyboard.up('ArrowLeft')

    // Wait for chat input
    const chatInput = page.locator('[data-testid="chat-input"]')
    await expect(chatInput).toBeVisible({ timeout: 3000 })

    // Send message with instructions for the agent to respond
    const instruction = [
      'Hello! Please respond by sending an HTTP POST request to',
      'http://localhost:3001/api/agent-response',
      'with Content-Type application/json and body:',
      `{ "agentId": "${agentId}", "message": "I received your message!" }`,
    ].join(' ')

    await chatInput.fill(instruction)
    await chatInput.press('Enter')

    // Wait for bubble to appear (agent needs time to process and POST back)
    const bubble = page.locator(`[data-testid="bubble-${agentId}"]`)
    await expect(bubble).toBeVisible({ timeout: 20000 })
    await expect(bubble).not.toBeEmpty()
  })
})
