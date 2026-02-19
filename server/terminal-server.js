const { WebSocketServer } = require('ws');
const pty = require('node-pty');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// --- Config ---
const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);
const DB_PATH = process.env.DATABASE_PATH || './db/saint-tower.db';
const DESKTOP = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop');
const API_BASE = `http://localhost:${parseInt(process.env.PORT || '3000', 10)}`;
const IDLE_TIMEOUT_MS = 3000; // 3 seconds of no output → idle

// Map github_repo → local Desktop folder name
const REPO_TO_FOLDER = {
  'demo-org/saint-tower': '../saint-tower',
  'demo-org/market-bot': '../market-bot',
  'demo-org/analytics': 'demo-analytics',
  'demo-org/marketing': 'demo-marketing',
  'demo-org/sales': 'demo-sales',
  'demo-org/proposals': 'demo-proposals',
  'ProjectA-demo/Agent-A1': 'ProjectA',
  'ProjectA-demo/Agent-A2': 'ProjectA-ML',
  'ProjectB-demo/Agent-B1': 'ProjectB',
  'ProjectB-demo/Agent-B2': 'ProjectB-Logistics',
  'ProjectC-demo/Agent-C1': 'ProjectC',
  'ProjectC-demo/Agent-C2': 'ProjectC-Config',
  'ProjectD-demo/Agent-D1': 'ProjectD',
  'ProjectE-demo/BackEnd': 'ProjectE',
  'ProjectE-demo/FrontEnd': 'ProjectE',
  'demo-org/certifications': 'demo-certifications',
};

// Per-agent output tracker for status detection
const agentOutputTimers = new Map(); // agentId → { idleTimer, lastStatusPost, isIdle }

// Registry of active PTY processes for message delivery
const agentPtyProcesses = new Map(); // agentId → ptyProcess

function lookupAgent(agentId) {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const agent = db.prepare('SELECT github_repo, claude_md FROM agents WHERE id = ?').get(agentId);
    db.close();
    return agent;
  } catch (err) {
    console.error(`[DB] Failed to lookup agent ${agentId}:`, err.message);
    return null;
  }
}

function getWorkingDir(agent) {
  if (agent && agent.github_repo && REPO_TO_FOLDER[agent.github_repo]) {
    return path.join(DESKTOP, REPO_TO_FOLDER[agent.github_repo]);
  }
  return process.env.USERPROFILE || process.env.HOME || '';
}

// Debounced status update — max 1 per second per agent
function postAgentStatus(agentId, status) {
  const tracker = agentOutputTimers.get(agentId);
  if (!tracker) return;

  const now = Date.now();
  if (now - tracker.lastStatusPost < 1000) return; // debounce
  tracker.lastStatusPost = now;

  fetch(`${API_BASE}/api/agents/${agentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).catch(() => {
    // Silent — API might not be up yet
  });
}

// --- WebSocket Server ---
const wss = new WebSocketServer({ port: WS_PORT });

console.log(`[terminal-server] Listening on ws://localhost:${WS_PORT}`);
console.log(`[terminal-server] Desktop: ${DESKTOP}`);

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${WS_PORT}`);
  const agentId = url.searchParams.get('agentId');
  const subdir = url.searchParams.get('subdir'); // e.g. "Dashboards/Finance"

  if (!agentId) {
    ws.send(JSON.stringify({ type: 'error', data: 'Missing agentId parameter' }));
    ws.close();
    return;
  }

  console.log(`[terminal-server] New connection for agent: ${agentId}${subdir ? ` subdir: ${subdir}` : ''}`);

  const agent = lookupAgent(agentId);
  const baseCwd = getWorkingDir(agent);
  const cwd = subdir ? path.join(baseCwd, subdir) : baseCwd;
  const claudeMd = agent && agent.claude_md;

  // Write CLAUDE.md to working dir if content exists in DB
  if (claudeMd && fs.existsSync(baseCwd)) {
    try {
      // Write to the actual cwd (subdir or base)
      if (!fs.existsSync(cwd)) {
        fs.mkdirSync(cwd, { recursive: true });
      }
      fs.writeFileSync(path.join(cwd, 'CLAUDE.md'), claudeMd, 'utf-8');
      console.log(`[terminal-server] Wrote CLAUDE.md to ${cwd}`);
    } catch (err) {
      console.error(`[terminal-server] Failed to write CLAUDE.md:`, err.message);
    }
  }

  // Initialize per-agent output tracker
  agentOutputTimers.set(agentId, {
    idleTimer: null,
    lastStatusPost: 0,
    isIdle: false,
  });

  // Find bash shell — Git Bash on Windows
  const shell = process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : '/bin/bash';

  // Build startup command
  let startupCmd;
  if (subdir) {
    const prompt = 'Read the README.md and CHANGELOG.md of this dashboard, explain what it does and what tables it uses.';
    startupCmd = `cd "${cwd.replace(/\\/g, '/')}" && clear && claude "${prompt}"`;
  } else {
    startupCmd = `cd "${cwd.replace(/\\/g, '/')}" && clear && claude`;
  }

  // Build clean env — strip Claude Code session vars to prevent nested session detection
  const cleanEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      !key.startsWith('CLAUDE') &&
      !key.startsWith('MCP_') &&
      key !== 'ANTHROPIC_API_KEY_ENCRYPTED'
    )
  );
  cleanEnv.TERM = 'xterm-256color';

  // Spawn local PTY
  let ptyProcess;
  try {
    ptyProcess = pty.spawn(shell, ['--login', '-c', startupCmd], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: cwd,
      env: cleanEnv,
    });
  } catch (err) {
    console.error(`[terminal-server] Failed to spawn PTY:`, err.message);
    ws.send(JSON.stringify({ type: 'error', data: `Failed to spawn terminal: ${err.message}` }));
    ws.close();
    return;
  }

  console.log(`[terminal-server] PTY spawned (pid ${ptyProcess.pid}) for agent: ${agentId} in ${cwd}`);

  // Register PTY for message delivery
  agentPtyProcesses.set(agentId, ptyProcess);

  // PTY stdout → WebSocket + status tracking
  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }

    // Status detection: agent is actively producing output → "active"
    const tracker = agentOutputTimers.get(agentId);
    if (tracker) {
      tracker.isIdle = false;
      postAgentStatus(agentId, 'active');

      // Reset idle timer
      if (tracker.idleTimer) clearTimeout(tracker.idleTimer);
      tracker.idleTimer = setTimeout(() => {
        // 3 seconds of no output → send idle signal to client
        tracker.isIdle = true;
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'agent_idle', agentId }));
        }
        postAgentStatus(agentId, 'idle');
        deliverPendingMessages(agentId);
      }, IDLE_TIMEOUT_MS);
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[terminal-server] PTY exited (code ${exitCode}) for agent: ${agentId}`);

    // Post offline status BEFORE deleting tracker (postAgentStatus needs the tracker)
    postAgentStatus(agentId, 'offline');

    // Clean up tracker and PTY registry
    const tracker = agentOutputTimers.get(agentId);
    if (tracker && tracker.idleTimer) clearTimeout(tracker.idleTimer);
    agentOutputTimers.delete(agentId);
    agentPtyProcesses.delete(agentId);

    if (ws.readyState === ws.OPEN) {
      // Send completion message for notification sound
      ws.send(JSON.stringify({ type: 'completed', agentId }));
      ws.send(JSON.stringify({ type: 'disconnect', data: 'Terminal session ended' }));
      ws.close();
    }
  });

  // WebSocket messages → PTY stdin
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'input') {
        ptyProcess.write(msg.data);
      } else if (msg.type === 'resize') {
        ptyProcess.resize(msg.cols, msg.rows);
      } else if (msg.type === 'deliver_messages') {
        deliverPendingMessages(agentId);
      }
    } catch {
      // Ignore malformed messages
    }
  });

  // Cleanup on WebSocket close
  ws.on('close', () => {
    console.log(`[terminal-server] WebSocket closed for agent: ${agentId}`);

    // Clean up tracker and PTY registry
    const tracker = agentOutputTimers.get(agentId);
    if (tracker && tracker.idleTimer) clearTimeout(tracker.idleTimer);
    agentOutputTimers.delete(agentId);
    agentPtyProcesses.delete(agentId);

    try {
      ptyProcess.kill();
    } catch {
      // Already dead
    }
  });
});

// --- Message Delivery ---

async function deliverPendingMessages(agentId) {
  const tracker = agentOutputTimers.get(agentId);
  const ptyProc = agentPtyProcesses.get(agentId);
  if (!tracker || !tracker.isIdle || !ptyProc) return;

  try {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/refresh-inbox`, {
      method: 'POST',
    });
    if (!res.ok) return;

    const data = await res.json();
    if (data.messageCount > 0) {
      console.log(`[terminal-server] Delivering ${data.messageCount} message(s) to ${agentId}`);
      ptyProc.write(`You have ${data.messageCount} new message(s). Read INBOX.md for details.\n`);
      tracker.isIdle = false;
    }
  } catch (err) {
    console.error(`[terminal-server] Failed to deliver messages to ${agentId}:`, err.message);
  }
}

// Polling: check for pending messages every 10s for idle agents
setInterval(() => {
  for (const [agentId, tracker] of agentOutputTimers.entries()) {
    if (tracker.isIdle && agentPtyProcesses.has(agentId)) {
      deliverPendingMessages(agentId);
    }
  }
}, 10000);

wss.on('error', (err) => {
  console.error('[terminal-server] Server error:', err.message);
});
