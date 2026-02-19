# Architecture

## Overview

Saint Tower is a visualization and management system for distributed AI agents.

```
┌─────────────────────────────────────────────────────────────┐
│                     SAINT TOWER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Frontend   │◄──►│   Backend   │◄──►│  Agents     │     │
│  │  (Next.js)  │    │   (API)     │    │  (Claude)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                   │            │
│         ▼                  ▼                   ▼            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Pixel Art  │    │  Database   │    │  Terminal   │     │
│  │  (PixiJS)   │    │  (SQLite)   │    │  (PTY/WS)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Frontend (Next.js + PixiJS)

Pixel art visual interface (SNES/Zelda style).

**Features:**
- Building map with offices
- Characters (agents) moving around
- Side control panel
- Real-time agent status

**Tech:**
- Next.js 16, React 19, TypeScript
- PixiJS 8 for pixel art rendering
- Tailwind CSS 4
- WebSocket for real-time updates

### 2. Backend (API Routes)

State management and coordination.

**Endpoints:**
```
GET  /api/offices              # List offices
GET  /api/agents               # List agents
GET  /api/agents/:id           # Agent details
POST /api/agents/:id/task      # Assign task
POST /api/agents/:id/launch    # Start agent session
GET  /api/messages             # Inter-agent messages
POST /api/messages             # Send message
GET  /api/workflows            # Workflow templates
POST /api/workflow-runs        # Execute workflow
GET  /api/scheduler            # Cron schedules
GET  /api/activity             # Activity feed
GET  /api/status               # System health
```

**Tech:**
- Next.js API Routes
- better-sqlite3 for database
- node-cron for scheduling

### 3. Terminal Server (WebSocket)

Each agent gets a PTY terminal session.

**Features:**
- Spawns bash shells per agent
- Writes CLAUDE.md to agent working directory
- Status tracking (active/idle/offline)
- Message delivery on idle detection
- Real-time output streaming

**Tech:**
- node-pty for terminal emulation
- ws (WebSocket) for real-time communication
- xterm.js on the frontend

### 4. Agent Execution

Each agent is a Claude Code session in its own working directory.

**Flow:**
- Agent spawned via PTY
- CLAUDE.md injected with role + team context
- Agent works autonomously
- Messages delivered when idle (3s timeout)
- Status tracked via output monitoring

---

## Data Flow

### 1. User assigns task

```
User (Frontend)
    → Click on agent
    → Assign task
    → Backend receives POST /api/agents/:id/task
    → Terminal server spawns Claude session
    → Agent executes
    → Status updates via WebSocket
    → Activity logged
```

### 2. Cron workflow executes

```
Scheduler (node-cron)
    → Triggers workflow
    → Steps execute sequentially/parallel
    → Each step assigns task to agent
    → Results chain to next step
    → Activity feed updated
```

### 3. Real-time visualization

```
Frontend
    → WebSocket connection to terminal server
    → Agent output streamed to terminal panel
    → Status changes reflected in pixel art
    → Activity feed updates live
```

---

## Database Schema

### Core Tables

- **offices** — Office definitions (id, name, type, parent, color, github_org)
- **agents** — Agent definitions (id, name, role, office, status, github_repo, claude_md)
- **tasks** — Task assignments and results
- **activity_logs** — Agent activity tracking
- **agent_messages** — Inter-agent messaging with delivery tracking
- **workflows** — Workflow templates with cron schedules
- **workflow_runs** — Workflow execution instances
- **workflow_steps** — Individual step tracking
- **repo_cache** — GitHub API response cache
- **daily_digests** — Daily commit summaries

---

## Pixel Art

### Style
- SNES / Zelda: A Link to the Past
- Top-down view
- 16x16 sprites
- Retro color palette

### Assets
- Building/office tiles
- Animated character sprites (anime-style)
- Furniture (desks, plants, etc.)
- UI elements

### Tools
- PixiJS 8 (rendering engine)
- Custom sprite sheets
- Tile-based map system
