<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/PixiJS-8-E72264?style=flat-square" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

# Saint Tower

A virtual office building in pixel art style where AI agents work autonomously — writing code, analyzing data, sending reports, and coordinating with each other in real time.

Think of it as a **command center for AI agents**, visualized as a retro SNES/Pokemon-style building where each room is a project and each character is a specialized Claude Code session.

## What It Does

- **17 AI agents** across 8 offices, each with their own role, terminal, and context
- **Pixel art visualization** — top-down building with animated characters walking around
- **Real-time terminals** — each agent gets a live PTY session you can watch and interact with
- **Inter-agent messaging** — agents communicate with each other through an internal messaging system with animated envelopes
- **Workflow automation** — cron-scheduled multi-step workflows that chain agent tasks
- **Activity feed** — live stream of commits, tasks, and messages across the entire tower
- **Telegram integration** — remote agent management via bot commands

## Building Structure

```
SAINT TOWER
│
├── SA Core ─────── main office (strategy, marketing, sales, proposals)
│   ├── Project A ── client project (SQL + ML agents)
│   └── Project B ── client project (ops + logistics agents)
│
├── Project C ────── independent project (analytics)
├── Project D ────── independent project (data)
├── Project E ────── independent project (backend + frontend)
├── Lab ──────────── research & experiments
└── Library ──────── learning & certifications
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Pixel Art | PixiJS 8 with custom anime-style spritesheets |
| Backend | Next.js API Routes |
| Database | SQLite via better-sqlite3 |
| Terminals | node-pty + WebSocket (xterm.js) |
| Scheduling | node-cron for automated workflows |
| Agents | Claude Code sessions (one per agent) |
| Messaging | SSH bridge + Telegram bot integration |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/saintamant/saint-tower-open.git
cd saint-tower-open

# Install dependencies
npm install

# Copy environment config
cp .env.example .env.local

# Initialize the database
node db/seed.js

# Start everything (Next.js + terminal server)
npm run dev
```

Open **http://localhost:3000** to see the tower.

### Demo Mode

Want to see the tower in action without real agents? Run the demo simulator:

```bash
node server/demo-simulate.js
```

This generates fake agent activity — status changes, commits, messages, tasks — so you can see the full UI working.

## Configuration

Copy `.env.example` to `.env.local` and configure:

```env
# Server
PORT=3000                              # Next.js port
WS_PORT=3001                           # WebSocket terminal server port

# Database
DATABASE_PATH=./db/saint-tower.db      # SQLite database path

# SSH (optional — for remote agent execution)
SSH_HOST=localhost
SSH_USER=your-user
SSH_KEY_PATH=~/.ssh/id_rsa

# Telegram (optional — for remote management)
TELEGRAM_ADMIN_CHAT_ID=your-chat-id

# Gateway (optional — for remote agent management)
CLAWDBOT_GATEWAY_TOKEN=your-token-here
```

## API

The backend exposes REST endpoints for managing the tower:

```
GET  /api/offices              # List all offices
GET  /api/agents               # List all agents
GET  /api/agents/:id           # Agent details
POST /api/agents/:id/task      # Assign a task to an agent
POST /api/agents/:id/launch    # Start an agent session
GET  /api/messages             # Inter-agent messages
POST /api/messages             # Send a message between agents
GET  /api/workflows            # Workflow templates
POST /api/workflow-runs        # Execute a workflow
GET  /api/scheduler            # Cron schedules
GET  /api/activity             # Activity feed
GET  /api/status               # System health
```

## How Agents Work

Each agent is an independent Claude Code session:

1. **Launch** — a PTY terminal spawns in the agent's working directory
2. **Context** — a `CLAUDE.md` file is injected with the agent's role, team info, and communication protocol
3. **Execution** — the agent works autonomously on assigned tasks
4. **Messaging** — when idle (3s timeout), pending messages from other agents are delivered
5. **Visualization** — status changes and output stream to the pixel art UI in real time

Agents can talk to each other, coordinate on tasks, and chain workflows — all visible in the building as animated characters with flying envelope icons.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design, data flow, components
- [Offices](docs/OFFICES.md) — building structure and office details
- [Agents](docs/AGENTS.md) — all 17 agents with roles and responsibilities

## License

MIT
