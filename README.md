# Saint Tower

Virtual office with AI agents for managing projects and companies.

## Concept

A virtual building in pixel art style (SNES/Zelda) where each office represents a company or project, and each character is a specialized AI agent working 24/7.

## Structure

```
SAINT TOWER
│
├── SA Core — main consulting office
│   ├── Project A — client project
│   └── Project B — client project
│
├── Project C — independent project
├── Project D — independent project
├── Project E — independent project
├── Lab — research lab
└── Library — learning & certifications
```

## Tech Stack

- **Frontend**: Next.js + PixiJS (pixel art)
- **Backend**: Next.js API Routes + SQLite
- **Terminal**: node-pty + WebSocket (xterm.js)
- **Scheduling**: node-cron for automated workflows
- **Agents**: Claude Code sessions per agent

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env.local

# Initialize the database
node db/seed.js

# Start the development server
npm run dev

# In a separate terminal, start the terminal server
node server/terminal-server.js
```

Open http://localhost:3000 to see the tower.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Offices](docs/OFFICES.md)
- [Agents](docs/AGENTS.md)

## License

MIT
