/**
 * demo-simulate.js — Cinematic Demo Simulation
 *
 * Scripted, narrative-driven simulation for recording a demo video.
 * Activates ALL visual elements: agent boot sequence, envelope animations,
 * workflow progress bars, commits, activity feed, task bubbles, room colors.
 *
 * 5 Phases (~150s):
 *   1. Boot        — Agents light up one by one
 *   2. Telegram    — OpenClawBot receives command, manager dispatches
 *   3. Workflows   — Two workflows with parallel steps and progress bars
 *   4. Burst       — All projects active, commits flying, messages everywhere
 *   5. Wrap-up     — Tasks complete, agents wind down, summary
 *
 * Usage: node server/demo-simulate.js [port]
 * Default port: 3100
 */

const API = `http://localhost:${process.argv[2] || 3100}`;

// ─── HTTP Helpers ───────────────────────────────────────────────────────────

async function get(path) {
  try {
    const res = await fetch(`${API}${path}`);
    return await res.json();
  } catch { return null; }
}

async function post(path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch { return null; }
}

async function patch(path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch { return null; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = () => Math.random().toString(16).slice(2, 9);

// ─── Agent Helpers ──────────────────────────────────────────────────────────

const activeSet = new Set();

async function activate(id, task) {
  activeSet.add(id);
  const body = { status: 'active' };
  if (task !== undefined) body.currentTask = task;
  await patch(`/api/agents/${id}`, body);
}

async function deactivate(id) {
  activeSet.delete(id);
  await patch(`/api/agents/${id}`, { status: 'idle', currentTask: null });
}

async function setTask(id, task) {
  await patch(`/api/agents/${id}`, { currentTask: task });
}

async function logCommit(agentId, msg) {
  await post('/api/activity', { agentId, type: 'commit', content: `${sha()} — ${msg}` });
}

async function logInfo(agentId, msg) {
  await post('/api/activity', { agentId, type: 'info', content: msg });
}

async function logTaskStart(agentId, msg) {
  await post('/api/activity', { agentId, type: 'task_start', content: msg });
}

async function logTaskComplete(agentId, msg) {
  await post('/api/activity', { agentId, type: 'task_complete', content: msg });
}

async function sendMsg(from, to, content) {
  await post('/api/messages', { fromAgentId: from, toAgentId: to, content });
}

async function triggerOrchestrator() {
  await get('/api/status');
}

async function startWorkflow(workflowId, input) {
  return await post(`/api/workflows/${workflowId}/run`, { input });
}

async function completeStep(runId, stepId, result) {
  await patch(`/api/workflow-runs/${runId}/steps/${stepId}`, {
    status: 'completed',
    result: result || 'Done',
  });
}

// ─── Heartbeat ──────────────────────────────────────────────────────────────
// /api/status resets agents to idle if lastActivityAt > 30s.
// Heartbeat every 12s keeps active agents alive.

let heartbeatInterval;

function startHeartbeat() {
  heartbeatInterval = setInterval(async () => {
    const promises = [];
    for (const id of activeSet) {
      promises.push(patch(`/api/agents/${id}`, { status: 'active' }));
    }
    await Promise.all(promises);
  }, 12_000);
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
}

// ─── Console ────────────────────────────────────────────────────────────────

let startTime;

function log(phase, msg) {
  const t = ((Date.now() - startTime) / 1000).toFixed(1).padStart(6);
  console.log(`  [${t}s] [${phase}] ${msg}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 — BOOT (~15s)
// Agents come online one by one. Rooms light up from dark to green.
// ═══════════════════════════════════════════════════════════════════════════

async function phase1_boot() {
  log('BOOT', '═══ Phase 1: Tower Boot Sequence ═══');

  // Juan is always active — announce init
  await activate('juan', 'Tower initializing...');
  await logInfo('juan', 'Tower boot sequence initiated');
  log('BOOT', 'juan online — Tower initializing...');
  await sleep(1500);

  // SA Core team lights up
  const saCore = ['manager', 'openclaw-bot', 'sa-main', 'content-writer', 'outreach', 'proposals'];
  for (const id of saCore) {
    await activate(id);
    log('BOOT', `${id} online`);
    await sleep(500);
  }
  await sleep(800);

  // Projects E & A
  for (const id of ['agent-e1', 'agent-e2', 'agent-a1', 'agent-a2']) {
    await activate(id);
    log('BOOT', `${id} online`);
    await sleep(400);
  }
  await sleep(500);

  // Projects B & C
  for (const id of ['agent-b1', 'agent-b2', 'agent-c1', 'agent-c2']) {
    await activate(id);
    log('BOOT', `${id} online`);
    await sleep(400);
  }
  await sleep(500);

  // Solo offices: D, Lab, Library
  for (const id of ['agent-d1', 'lab-bot', 'learn-bot']) {
    await activate(id);
    log('BOOT', `${id} online`);
    await sleep(500);
  }

  await setTask('juan', 'All 18 agents online. Tower fully operational.');
  await logInfo('juan', 'All 18 agents online. Tower fully operational.');
  log('BOOT', 'All 18 agents online. Tower fully operational.');
  await sleep(2000);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — TELEGRAM TRIGGER (~24s)
// OpenClawBot receives /weekly-plan → dispatches to manager → team.
// ═══════════════════════════════════════════════════════════════════════════

async function phase2_telegram() {
  log('TGRAM', '═══ Phase 2: Telegram Trigger ═══');

  // OpenClawBot receives command
  await setTask('openclaw-bot', 'Received /weekly-plan "Q1 growth sprint"');
  await logInfo('openclaw-bot', 'Telegram command received: /weekly-plan "Q1 growth sprint"');
  log('TGRAM', 'OpenClawBot receives /weekly-plan "Q1 growth sprint"');
  await sleep(2000);

  // Dispatch to manager (envelope animation)
  await sendMsg('openclaw-bot', 'manager',
    'Telegram command from admin: /weekly-plan "Q1 growth sprint". Dispatching to you for execution.');
  log('TGRAM', 'MSG openclaw-bot → manager');
  await sleep(2000);

  // Manager reviews KPIs
  await setTask('manager', 'Reviewing KPIs and planning Q1 sprint');
  await logTaskStart('manager', 'Reviewing weekly KPIs for Q1 growth sprint');
  log('TGRAM', 'Manager reviewing KPIs...');
  await sleep(2500);

  await logCommit('manager', 'Update Q1 OKR tracking with growth targets');
  log('TGRAM', 'Manager commits OKR update');
  await sleep(1500);

  // Manager distributes tasks to team
  await sendMsg('manager', 'sa-main',
    'Need conversion funnel analysis ASAP. Focus on Q1 growth metrics. Check drop-off at step 3.');
  log('TGRAM', 'MSG manager → sa-main');
  await sleep(2000);

  // Parallel dispatch
  await sendMsg('manager', 'content-writer',
    'Draft LinkedIn post about our AI agent orchestration. Angle: how 18 agents collaborate on 6 projects.');
  await sendMsg('manager', 'outreach',
    'Q1 priority: enterprise fintech leads. Research 5 companies this week. Focus on AI analytics buyers.');
  log('TGRAM', 'MSG manager → content-writer + outreach');
  await sleep(2000);

  // SA Main responds with analysis
  await setTask('sa-main', 'Analyzing conversion funnel data');
  await logTaskStart('sa-main', 'Running conversion funnel analysis');
  await sleep(2500);

  await logCommit('sa-main', 'Add conversion funnel metrics with drop-off analysis');
  await sendMsg('sa-main', 'manager',
    'Funnel analysis done. Biggest drop: step 3 (proposal review) at 34%. Recommend: auto-follow-ups + simplified proposal flow.');
  log('TGRAM', 'sa-main responds with analysis');
  await sleep(2000);

  // Manager forwards insight to proposals
  await sendMsg('manager', 'proposals',
    'New priority: simplify proposal flow. Drop-off at review step is 34%. Draft a streamlined template for fintech clients.');
  await setTask('proposals', 'Drafting streamlined proposal template');
  await logTaskStart('proposals', 'Creating streamlined fintech proposal template');
  log('TGRAM', 'MSG manager → proposals — proposals starts working');
  await sleep(2000);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — WORKFLOWS (~48s)
// Two workflows with visible progress bars and step transitions.
// ═══════════════════════════════════════════════════════════════════════════

async function phase3_workflows() {
  log('WFLOW', '═══ Phase 3: Workflows ═══');

  // ── Workflow 1: Weekly Planning (ID 3) ──────────────────────────────────
  log('WFLOW', '── Starting: Weekly Planning ──');

  const wf1 = await startWorkflow(3, 'Q1 growth sprint — focus: conversion optimization');
  const wf1Run = wf1?.run?.id;
  const wf1Steps = wf1?.steps || [];
  log('WFLOW', `Weekly Planning started (run #${wf1Run})`);

  // Kick orchestrator to show the workflow in the panel
  await triggerOrchestrator();
  await sleep(2000);

  // Step 1: Manager reviews (auto-started by startWorkflowRun)
  await setTask('manager', '[Workflow] Weekly Review & Plan');
  await logCommit('manager', 'Generate weekly KPI summary with team velocity metrics');
  await sleep(3000);

  await logCommit('manager', 'Prioritize Q1 growth initiatives with resource allocation');
  await sleep(3000);

  // Complete step 1
  const wf1s1 = wf1Steps.find((s) => s.step_order === 1);
  if (wf1s1) {
    await completeStep(wf1Run, wf1s1.id,
      'Weekly plan: 1) Optimize conversion funnel 2) Launch fintech outreach 3) Publish 2 LinkedIn posts 4) Prepare 3 proposals');
    log('WFLOW', 'Step 1 (Manager: Review) ✓');
  }

  // Trigger orchestrator → Steps 2+3 start in parallel
  await triggerOrchestrator();
  await sleep(2000);

  // Content Writer + Outreach work in parallel
  await setTask('content-writer', '[Workflow] Content Planning');
  await setTask('outreach', '[Workflow] Lead Prospecting');

  await logCommit('content-writer', 'Draft LinkedIn post: AI Agent Orchestration in Enterprise');
  log('WFLOW', 'content-writer drafting posts...');
  await sleep(2000);

  await logCommit('outreach', 'Research fintech leads: 3 enterprise targets identified');
  log('WFLOW', 'outreach researching leads...');
  await sleep(2000);

  await sendMsg('content-writer', 'outreach',
    'Post draft mentions our lead gen capabilities. Want to coordinate messaging?');
  log('WFLOW', 'MSG content-writer → outreach');
  await sleep(2000);

  await logCommit('content-writer', 'Finalize 2 LinkedIn posts with CTA and engagement hooks');

  // Complete step 2 (content)
  const wf1s2 = wf1Steps.find((s) => s.step_order === 2);
  if (wf1s2) {
    await completeStep(wf1Run, wf1s2.id,
      '2 LinkedIn posts ready: "AI Orchestration at Scale" and "Multi-Agent Workflows in Production"');
    log('WFLOW', 'Step 2 (Content Planning) ✓');
  }
  await triggerOrchestrator();
  await sleep(3000);

  await logCommit('outreach', 'Prepare personalized outreach for 5 fintech enterprise leads');
  await logInfo('outreach', 'Identified 5 new leads in the fintech sector');

  // Complete step 3 (outreach)
  const wf1s3 = wf1Steps.find((s) => s.step_order === 3);
  if (wf1s3) {
    await completeStep(wf1Run, wf1s3.id,
      '5 leads identified: TechFin Corp, DataVault, AnalyticsPro, CreditAI, PayStream');
    log('WFLOW', 'Step 3 (Lead Prospecting) ✓ → Workflow 1 DONE');
  }
  await triggerOrchestrator();
  await sleep(3000);

  // ── Workflow 2: Cross-Project Report (ID 2) ─────────────────────────────
  log('WFLOW', '── Starting: Cross-Project Report ──');

  const wf2 = await startWorkflow(2, 'February performance report');
  const wf2Run = wf2?.run?.id;
  const wf2Steps = wf2?.steps || [];
  log('WFLOW', `Cross-Project Report started (run #${wf2Run})`);

  await triggerOrchestrator();
  await sleep(2000);

  // Steps 1+2 parallel (agent-c1 + agent-d1)
  await setTask('agent-c1', '[Workflow] Analytics Data');
  await setTask('agent-d1', '[Workflow] Metrics Data');

  await logCommit('agent-c1', 'Pull analytics pipeline data for February report');
  await sleep(2000);

  await logCommit('agent-d1', 'Aggregate weekly performance metrics across all projects');
  await sleep(2000);

  // Complete both parallel steps
  const wf2s1 = wf2Steps.find((s) => s.step_order === 1);
  const wf2s2 = wf2Steps.find((s) => s.step_order === 2);
  if (wf2s1) {
    await completeStep(wf2Run, wf2s1.id,
      'Analytics: 847 events processed, 12% conversion rate, 3 funnels optimized');
    log('WFLOW', 'Step 1 (Analytics Data) ✓');
  }
  if (wf2s2) {
    await completeStep(wf2Run, wf2s2.id,
      'Metrics: Revenue +18%, Active users +24%, Churn -3%');
    log('WFLOW', 'Step 2 (Metrics Data) ✓');
  }

  // Trigger orchestrator → Step 3 starts (sa-main compiles)
  await triggerOrchestrator();
  await sleep(2000);

  await setTask('sa-main', '[Workflow] Compile Report');
  await logCommit('sa-main', 'Compile cross-project February performance report');
  await sleep(3000);

  const wf2s3 = wf2Steps.find((s) => s.step_order === 3);
  if (wf2s3) {
    await completeStep(wf2Run, wf2s3.id,
      'February Report: Revenue $142k (+18%), 847 analytics events, 5 new leads, 3 proposals sent');
    log('WFLOW', 'Step 3 (Compile Report) ✓ → Workflow 2 DONE');
  }
  await triggerOrchestrator();
  await sleep(2000);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — ACTIVITY BURST (~30s)
// All projects active. Commits flying, messages between agents.
// ═══════════════════════════════════════════════════════════════════════════

async function phase4_burst() {
  log('BURST', '═══ Phase 4: Activity Burst ═══');

  // ── Project E: backend ↔ frontend ──
  await setTask('agent-e1', 'Implementing payment webhook handler');
  await setTask('agent-e2', 'Building responsive calendar component');
  await Promise.all([
    logCommit('agent-e1', 'Implement payment webhook handler with retry logic'),
    logCommit('agent-e2', 'Redesign calendar component with drag-and-drop support'),
  ]);
  log('BURST', 'Project E: e1+e2 committing');
  await sleep(2000);

  await sendMsg('agent-e1', 'agent-e2',
    'Webhook API ready. Updated response schema — please update frontend integration.');
  log('BURST', 'MSG agent-e1 → agent-e2');
  await sleep(1500);

  await sendMsg('agent-e2', 'agent-e1',
    'Frontend updated. Found missing field: cancellation_policy. Can you add it?');
  log('BURST', 'MSG agent-e2 → agent-e1');
  await sleep(2000);

  // ── Project A: SQL + ML ──
  await setTask('agent-a1', 'Optimizing SQL queries for report generation');
  await setTask('agent-a2', 'Retraining classification model');
  await logCommit('agent-a1', 'Optimize SQL query performance — 3x faster report generation');
  log('BURST', 'Project A: SQL optimization');
  await sleep(1500);

  await sendMsg('agent-a1', 'agent-a2',
    'Query optimization done. New data pipeline 3x faster. Retrain model with latest dataset.');
  log('BURST', 'MSG agent-a1 → agent-a2');
  await sleep(1500);

  await logCommit('agent-a2', 'Retrain classification model with updated feature set — accuracy 94.2%');
  log('BURST', 'Project A: ML retrain');
  await sleep(2000);

  // ── Project B: ops + logistics ──
  await setTask('agent-b1', 'Processing daily operations batch — 142 items');
  await setTask('agent-b2', 'Integrating new shipping provider API');
  await logCommit('agent-b1', 'Add batch processing for daily operations — 142 items queued');
  await sleep(1000);

  await sendMsg('agent-b1', 'agent-b2',
    'Batch processing complete. 142 items processed, 3 flagged for review. Shipment tracking update needed.');
  log('BURST', 'MSG agent-b1 → agent-b2');
  await sleep(1500);

  await logCommit('agent-b2', 'Implement real-time shipment tracking with provider webhook');
  log('BURST', 'Project B: ops + logistics');
  await sleep(2000);

  // ── Project C: health + dashboard ──
  await setTask('agent-c1', 'Running automated health checks');
  await setTask('agent-c2', 'Updating dashboard configuration');
  await Promise.all([
    logCommit('agent-c1', 'Add automated health checks — all 12 pipeline checks passed'),
    logInfo('agent-c1', 'Data pipeline health: all 12 checks passed'),
  ]);
  await sleep(1000);

  await sendMsg('agent-c1', 'agent-c2',
    'All health checks passed. Pipeline integrity confirmed. Dashboard config can be updated safely.');
  log('BURST', 'MSG agent-c1 → agent-c2');
  await sleep(1500);

  await logCommit('agent-c2', 'Update analytics dashboard with new widget configuration');
  log('BURST', 'Project C: health + dashboard');
  await sleep(1500);

  // ── Solo agents ──
  await setTask('agent-d1', 'Generating weekly aggregated report');
  await Promise.all([
    logCommit('agent-d1', 'Implement data aggregation pipeline — 847 data points processed'),
    logInfo('agent-d1', 'Weekly report generated: 847 data points processed'),
  ]);
  log('BURST', 'Project D: weekly report');
  await sleep(1500);

  await setTask('lab-bot', 'Analyzing market trends');
  await Promise.all([
    logInfo('lab-bot', 'Research: 3 high-confidence trading opportunities detected'),
    logCommit('lab-bot', 'Update market sentiment analysis with new indicators'),
  ]);
  log('BURST', 'Lab: market analysis');
  await sleep(1500);

  await setTask('learn-bot', 'Completing RL exercises');
  await Promise.all([
    logInfo('learn-bot', 'Completed Module 4: Reinforcement Learning — Score: 96%'),
    logCommit('learn-bot', 'Complete reinforcement learning exercises with policy gradient'),
  ]);
  log('BURST', 'Library: RL exercises');
  await sleep(2000);

  // ── SA Core final burst ──
  await sendMsg('outreach', 'proposals',
    'HOT LEAD: TechFin Corp — VP of Engineering interested in AI analytics. $18k/month potential. Priority proposal needed.');
  log('BURST', 'MSG outreach → proposals (hot lead!)');
  await sleep(2000);

  await setTask('proposals', 'Generating enterprise AI consulting proposal');
  await logCommit('proposals', 'Generate TechFin Corp proposal — $18k/month AI analytics package');
  await sleep(2000);

  await sendMsg('proposals', 'manager',
    'Proposal ready for TechFin Corp. $18k/month AI analytics package. Needs final review before sending.');
  log('BURST', 'MSG proposals → manager');
  await sleep(2000);

  await Promise.all([
    logCommit('outreach', 'Update lead scoring model — 5 new enterprise leads qualified'),
    logInfo('outreach', 'Pipeline update: 5 qualified leads, 2 proposals pending, $43k potential MRR'),
  ]);
  log('BURST', 'Outreach: pipeline update');
  await sleep(2000);

  await sendMsg('manager', 'openclaw-bot',
    'Weekly summary ready. 18 agents active, 2 workflows completed, 14 commits today. Forward to Telegram channel.');
  log('BURST', 'MSG manager → openclaw-bot (weekly summary)');
  await sleep(1500);

  await logInfo('openclaw-bot', 'Telegram bridge: weekly summary forwarded to admin channel');
  await setTask('openclaw-bot', 'Summary forwarded to Telegram');
  log('BURST', 'OpenClawBot forwards to Telegram');
  await sleep(1500);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 — WRAP-UP (~25s)
// Tasks complete, agents go idle gradually, final summary.
// ═══════════════════════════════════════════════════════════════════════════

async function phase5_wrapup() {
  log('WRAP', '═══ Phase 5: Wrap-up ═══');

  // Tasks complete
  await Promise.all([
    logTaskComplete('proposals', 'TechFin Corp proposal: $18k/month AI analytics package — ready for review'),
    logTaskComplete('outreach', 'Q1 lead research: 5 enterprise leads qualified in fintech vertical'),
    logTaskComplete('content-writer', '2 LinkedIn posts published: AI Orchestration + Multi-Agent Workflows'),
  ]);
  await sleep(1000);
  await Promise.all([
    logTaskComplete('sa-main', 'February performance report compiled — Revenue +18%'),
    logTaskComplete('manager', 'Weekly planning complete — all tasks distributed'),
  ]);
  log('WRAP', 'Tasks completing...');
  await sleep(2000);

  // Final summary
  await setTask('juan', '18 agents | 2 workflows | 14 commits | 5 leads | $18k proposal');
  await logInfo('juan',
    'Daily summary: 18 agents, 2 workflows completed, 14 commits, 5 leads qualified, $18k proposal drafted');
  log('WRAP', 'Summary: 18 agents, 2 workflows, 14 commits, 5 leads, $18k proposal');
  await sleep(3000);

  // Peripheral agents go idle
  for (const id of ['learn-bot', 'lab-bot', 'agent-d1', 'agent-c2', 'agent-b2', 'agent-a2']) {
    await deactivate(id);
    log('WRAP', `${id} → idle`);
    await sleep(700);
  }
  await sleep(1500);

  // Project agents wind down
  for (const id of ['agent-c1', 'agent-b1', 'agent-a1', 'agent-e2', 'agent-e1']) {
    await deactivate(id);
    log('WRAP', `${id} → idle`);
    await sleep(600);
  }
  await sleep(1500);

  // SA Core winds down (except juan)
  for (const id of ['proposals', 'content-writer', 'outreach']) {
    await deactivate(id);
    log('WRAP', `${id} → idle`);
    await sleep(700);
  }
  await sleep(1500);

  // Final scheduling message
  await setTask('manager', 'Next run: SA Core Daily Standup at 08:00 AM');
  await logInfo('manager', 'Next automated workflow: SA Core Daily Standup at 08:00 AM');
  log('WRAP', 'Next automated run: SA Core Daily Standup at 08:00 AM');
  await sleep(3000);

  // Last agents go idle
  await deactivate('sa-main');
  await deactivate('openclaw-bot');
  await deactivate('manager');
  log('WRAP', 'sa-main, openclaw-bot, manager → idle');
  await sleep(1500);

  await setTask('juan', 'Tower standing by.');
  log('WRAP', 'Tower standing by. Simulation complete.');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  startTime = Date.now();

  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║   Saint Tower — Cinematic Demo Simulation     ║');
  console.log('  ╠═══════════════════════════════════════════════╣');
  console.log(`  ║   API: ${API.padEnd(40)}║`);
  console.log('  ║   Duration: ~150 seconds                     ║');
  console.log('  ║   Phases: Boot → Telegram → Workflows →      ║');
  console.log('  ║           Burst → Wrap-up                    ║');
  console.log('  ╚═══════════════════════════════════════════════╝');
  console.log('');

  // Verify API is reachable
  const status = await get('/api/status');
  if (!status) {
    console.error('  ERROR: Cannot reach API at ' + API);
    console.error('  Make sure the server is running: npm run dev');
    process.exit(1);
  }
  log('INIT', `API reachable — ${status.counts?.total || '?'} agents in database`);
  console.log('');

  // Start heartbeat to keep agents alive against auto-idle reset
  startHeartbeat();

  try {
    await phase1_boot();
    await phase2_telegram();
    await phase3_workflows();
    await phase4_burst();
    await phase5_wrapup();
  } finally {
    stopHeartbeat();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log(`  ✓ Simulation complete in ${elapsed}s`);
  console.log('');

  process.exit(0);
}

main();
