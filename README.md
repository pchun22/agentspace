# AgentSpace

A 2D virtual office where you walk around and talk to AI agents. Think gather.town, but the people at the desks are AI agents that respond via webhooks.

## What it does

- Walk around a pixel-art office with WASD or arrow keys
- Add AI agents via the UI — just give them a name and a webhook URL
- Walk up to an agent and type a message
- The message gets sent to the agent's webhook, the agent responds, and a speech bubble appears

## Getting started

### Prerequisites

- Node.js (v18+)
- npm

### Install and run

```bash
npm install
npm run dev
```

This starts both the backend (port 3001) and frontend (port 3000). Open http://localhost:3000.

### If your agents need to call back (most do)

Agents respond by POSTing to a callback URL. Since the app runs on localhost, you need a tunnel so agents can reach it:

```bash
# In a separate terminal
npm run tunnel
```

This prints a public URL like `https://something.loca.lt`. Then restart the app with that URL:

```bash
# Stop the running app (Ctrl+C), then:
PUBLIC_URL=https://something.loca.lt npm run dev
```

Now the callback URL sent to agents will use the tunnel.

## How to make changes

We use GitHub to track changes. The `main` branch is protected — you can't push to it directly.

### The workflow

1. **Create a branch** for your changes:
   ```bash
   git checkout -b my-change-name
   ```

2. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "Description of what you changed"
   ```

3. **Push your branch** and create a pull request:
   ```bash
   git push -u origin my-change-name
   ```
   Then go to GitHub and create a Pull Request, or use:
   ```bash
   gh pr create --title "My change" --body "What I changed and why"
   ```

4. **Merge on GitHub** — click the merge button on the PR page. Never merge from the command line.

### Tips

- If you're using Claude Code, you can ask it to create branches and PRs for you
- Always work on a branch, never directly on `main`
- If you're unsure about something, just ask Claude to help

## Project structure

```
server/index.ts          — Backend (Express): agent API, webhook proxy, SSE
src/App.tsx              — Main app shell, state management
src/components/
  GameWorld.tsx           — The game world (floor, walls, desks, avatars)
  ChatInput.tsx           — Chat bar that appears near agents
  AddAgentModal.tsx       — Modal for adding new agents
src/game/
  layout.ts              — World dimensions, desk positions, constants
  useGameLoop.ts          — Movement, collision, camera, walk animation
src/App.css              — All styles (pixel art theme)
```
