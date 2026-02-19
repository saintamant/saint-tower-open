/**
 * demo-simulate.js
 *
 * Generates continuous fake activity for demo/recording purposes.
 * Simulates agents working, sending messages, and creating commits.
 *
 * Usage: node server/demo-simulate.js [port]
 * Default port: 3100
 */

const API_BASE = `http://localhost:${process.argv[2] || 3100}`;

const AGENTS = [
  'manager', 'openclaw-bot', 'sa-main', 'content-writer', 'outreach', 'proposals',
  'agent-e1', 'agent-e2', 'agent-a1', 'agent-a2',
  'agent-b1', 'agent-b2', 'agent-c1', 'agent-c2', 'agent-d1',
  'lab-bot', 'learn-bot',
];

const COMMITS = [
  { agent: 'sa-main', msg: 'Update dashboard analytics with conversion funnel metrics' },
  { agent: 'sa-main', msg: 'Add real-time KPI tracking to main dashboard' },
  { agent: 'agent-e1', msg: 'Fix API endpoint validation and add rate limiting' },
  { agent: 'agent-e1', msg: 'Implement payment webhook handler' },
  { agent: 'agent-e2', msg: 'Redesign calendar component with drag-and-drop support' },
  { agent: 'agent-e2', msg: 'Add responsive layout for mobile flow' },
  { agent: 'agent-a1', msg: 'Optimize SQL query performance for report generation' },
  { agent: 'agent-a1', msg: 'Add automated data validation pipeline' },
  { agent: 'agent-a2', msg: 'Retrain classification model with updated dataset' },
  { agent: 'agent-a2', msg: 'Implement feature importance analysis module' },
  { agent: 'agent-b1', msg: 'Add batch processing for daily operations queue' },
  { agent: 'agent-b2', msg: 'Implement real-time shipment tracking integration' },
  { agent: 'agent-c1', msg: 'Add automated health checks for data pipeline integrity' },
  { agent: 'agent-c2', msg: 'Update analytics dashboard configuration schema' },
  { agent: 'agent-d1', msg: 'Implement data aggregation pipeline for weekly reports' },
  { agent: 'lab-bot', msg: 'Update market sentiment analysis with new indicators' },
  { agent: 'learn-bot', msg: 'Complete study module exercises' },
  { agent: 'content-writer', msg: 'Draft LinkedIn post: AI Agent Orchestration in Practice' },
  { agent: 'proposals', msg: 'Generate proposal template for enterprise AI consulting' },
  { agent: 'outreach', msg: 'Update lead scoring model with new engagement data' },
  { agent: 'manager', msg: 'Update weekly OKR tracking dashboard' },
  { agent: 'openclaw-bot', msg: 'Process incoming Telegram command: /status all agents' },
  { agent: 'openclaw-bot', msg: 'Dispatch task to agent-a1 via Telegram bridge' },
];

const TASKS = [
  { agent: 'manager', msg: 'Reviewing weekly KPIs and generating team priorities' },
  { agent: 'sa-main', msg: 'Analyzing conversion funnel data for Q1 report' },
  { agent: 'content-writer', msg: 'Drafting LinkedIn post about AI-powered workflows' },
  { agent: 'outreach', msg: 'Researching 10 new leads in the SaaS analytics sector' },
  { agent: 'proposals', msg: 'Generating custom proposal for enterprise client' },
  { agent: 'agent-e1', msg: 'Implementing new API v2 with rate limiting' },
  { agent: 'agent-e2', msg: 'Building responsive calendar component' },
  { agent: 'agent-a1', msg: 'Running SQL optimization analysis on main database' },
  { agent: 'agent-a2', msg: 'Training updated ML model on latest dataset' },
  { agent: 'agent-b1', msg: 'Processing daily operations batch - 142 items queued' },
  { agent: 'agent-b2', msg: 'Integrating new shipping provider API' },
  { agent: 'agent-c1', msg: 'Running daily analytics health check on data pipeline' },
  { agent: 'agent-c2', msg: 'Updating dashboard configuration with new metrics' },
  { agent: 'agent-d1', msg: 'Generating weekly aggregated performance report' },
  { agent: 'lab-bot', msg: 'Analyzing market trends and research opportunities' },
  { agent: 'learn-bot', msg: 'Completing Module 4: Computer Vision Fundamentals' },
  { agent: 'openclaw-bot', msg: 'Processing Telegram command queue — 3 pending requests' },
];

const MESSAGES = [
  { from: 'manager', to: 'sa-main', msg: 'Weekly review complete. Top priority: improve conversion funnel dashboard. Can you review the analytics data?' },
  { from: 'sa-main', to: 'content-writer', msg: 'New KPI dashboard is live with real-time metrics. Can you draft a post showcasing our AI-powered analytics?' },
  { from: 'outreach', to: 'proposals', msg: 'Warm lead from a fintech company - they need AI analytics for their sales pipeline. Can you prepare a proposal?' },
  { from: 'proposals', to: 'manager', msg: 'Proposal draft ready for review. Estimated project value: $15k/month. Please review before I send.' },
  { from: 'agent-e1', to: 'agent-e2', msg: 'New API v2 endpoint ready. Updated the response schema - please update frontend.' },
  { from: 'agent-e2', to: 'agent-e1', msg: 'Frontend updated for new schema. Found a missing field: cancellation_policy. Can you add it?' },
  { from: 'manager', to: 'outreach', msg: 'Great lead pipeline this week! Focus on enterprise clients in the fintech vertical for next week.' },
  { from: 'sa-main', to: 'manager', msg: 'Conversion funnel analysis done. Biggest drop-off at step 3 (proposal review). Recommend automating follow-ups.' },
  { from: 'content-writer', to: 'sa-main', msg: 'Post draft ready for review. Key angle: how we use AI agents to manage 6 projects simultaneously.' },
  { from: 'manager', to: 'content-writer', msg: 'Great draft! Add a section about workflow automation - thats our strongest differentiator.' },
  { from: 'openclaw-bot', to: 'manager', msg: 'Received Telegram command from admin: request weekly status summary for all agents.' },
  { from: 'manager', to: 'openclaw-bot', msg: 'Weekly summary dispatched. Please forward to Telegram channel.' },
];

const INFOS = [
  { agent: 'outreach', msg: 'Identified 5 new leads in the fintech sector' },
  { agent: 'manager', msg: 'Weekly KPIs: Revenue +12%, New leads +8%, Active projects: 6' },
  { agent: 'lab-bot', msg: 'Research analysis: 3 high-confidence opportunities detected' },
  { agent: 'learn-bot', msg: 'Completed Module 3: Deep Learning - Score: 92%' },
  { agent: 'sa-main', msg: 'Dashboard uptime: 99.7% this week, 0 critical errors' },
  { agent: 'agent-c1', msg: 'Data pipeline health: all 12 checks passed' },
  { agent: 'agent-d1', msg: 'Weekly report generated: 847 data points processed' },
  { agent: 'openclaw-bot', msg: 'Telegram bridge active: 12 commands processed today, 0 errors' },
];

// --- Helpers ---

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSha() {
  return Math.random().toString(16).slice(2, 9);
}

async function post(path, body) {
  try {
    await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {}
}

async function patch(path, body) {
  try {
    await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {}
}

// --- Simulation Loop ---

let activeAgents = new Set();
let tick = 0;

async function simulateTick() {
  tick++;
  const actions = [];

  // Every 3 ticks: toggle some agents active/idle
  if (tick % 3 === 0) {
    // Activate 2-4 random agents
    const toActivate = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < toActivate; i++) {
      const agent = randomItem(AGENTS);
      activeAgents.add(agent);
      actions.push(patch(`/api/agents/${agent}`, { status: 'active', lastActivityAt: new Date().toISOString() }));
    }
    // Deactivate 1-2
    const toDeactivate = Math.floor(Math.random() * 2) + 1;
    const activeArr = [...activeAgents];
    for (let i = 0; i < toDeactivate && activeArr.length > 3; i++) {
      const agent = randomItem(activeArr);
      activeAgents.delete(agent);
      actions.push(patch(`/api/agents/${agent}`, { status: 'idle' }));
    }
  }

  // Keep active agents' lastActivityAt fresh
  for (const agent of activeAgents) {
    actions.push(patch(`/api/agents/${agent}`, { lastActivityAt: new Date().toISOString() }));
  }

  // Every 2 ticks: create a commit
  if (tick % 2 === 0) {
    const commit = randomItem(COMMITS);
    actions.push(post('/api/activity', {
      agentId: commit.agent,
      type: 'commit',
      content: `${randomSha()} — ${commit.msg}`,
    }));
  }

  // Every 4 ticks: send a message between agents
  if (tick % 4 === 0) {
    const message = randomItem(MESSAGES);
    actions.push(post('/api/messages', {
      fromAgentId: message.from,
      toAgentId: message.to,
      content: message.msg,
    }));
    console.log(`  [MSG] ${message.from} → ${message.to}`);
  }

  // Every 5 ticks: task start/complete
  if (tick % 5 === 0) {
    const task = randomItem(TASKS);
    actions.push(post('/api/activity', {
      agentId: task.agent,
      type: Math.random() > 0.5 ? 'task_start' : 'task_complete',
      content: task.msg,
    }));
  }

  // Every 7 ticks: info event
  if (tick % 7 === 0) {
    const info = randomItem(INFOS);
    actions.push(post('/api/activity', {
      agentId: info.agent,
      type: 'info',
      content: info.msg,
    }));
  }

  await Promise.all(actions);

  if (tick % 10 === 0) {
    console.log(`[tick ${tick}] Active: ${[...activeAgents].join(', ')}`);
  }
}

// --- Main ---

async function main() {
  console.log(`[demo] Simulating activity on ${API_BASE}`);
  console.log('[demo] Press Ctrl+C to stop\n');

  // Initial burst: activate several agents
  const initial = ['manager', 'openclaw-bot', 'sa-main', 'content-writer', 'agent-e1', 'agent-c1', 'agent-a1'];
  for (const agent of initial) {
    activeAgents.add(agent);
    await patch(`/api/agents/${agent}`, { status: 'active', lastActivityAt: new Date().toISOString() });
  }
  console.log(`[demo] Initial agents activated: ${initial.join(', ')}\n`);

  // Run every 3 seconds
  setInterval(simulateTick, 3000);
}

main();
