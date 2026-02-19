import { NextResponse } from 'next/server';
import { getDb, seedData, cleanupOldData } from '@/lib/db';
import { computeRoomHealth } from '@/lib/health';
import { checkForNewCommits } from '@/lib/github';
import { orchestrate, getWorkflowRunSummaries, getPendingMessageCounts } from '@/lib/orchestrator';
import { scheduler } from '@/lib/scheduler';
import { OfficeHealth } from '@/types/agent';

let lastCommitCheck = 0;
const COMMIT_CHECK_INTERVAL = 60_000; // Check commits every 60s

let lastCleanup = 0;
const CLEANUP_INTERVAL = 3_600_000; // Cleanup old data every hour

export async function GET() {
  try {
    const db = getDb();
    seedData();
    scheduler.init();

    // Reset agents to idle — but preserve those with recent activity (active terminal sessions)
    db.prepare(`
      UPDATE agents SET status = 'idle'
      WHERE id != 'juan'
      AND (last_activity_at IS NULL OR last_activity_at < datetime('now', '-30 seconds'))
    `).run();
    db.prepare("UPDATE agents SET status = 'active' WHERE id = 'juan'").run();

    // Try to get live agent status from Clawdbot
    let liveAgents: Array<{ name: string; status: string }> = [];
    try {
      const { clawdbot } = await import('@/lib/clawdbot');
      liveAgents = await clawdbot.listAgents();

      // Update DB with live data from actual agent list
      for (const agent of liveAgents) {
        if (agent.name && agent.status) {
          const mappedStatus = agent.status === 'running' ? 'active' : agent.status === 'idle' ? 'idle' : 'offline';
          db.prepare('UPDATE agents SET status = ? WHERE name = ? OR id = ?')
            .run(mappedStatus, agent.name, agent.name);
        }
      }
    } catch {
      // SSH not available — agents stay idle (except Juan)
    }

    // Re-read agents AFTER status updates
    const agents = db.prepare(`
      SELECT id, status, office_id as officeId FROM agents
    `).all() as { id: string; status: string; officeId: string }[];

    const counts = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      idle: agents.filter(a => a.status === 'idle').length,
      offline: agents.filter(a => a.status === 'offline').length,
    };

    // Compute per-office health
    const officeIds = [...new Set(agents.map(a => a.officeId))];
    const offices: Record<string, OfficeHealth> = {};

    for (const officeId of officeIds) {
      const officeAgents = agents.filter(a => a.officeId === officeId);
      const activeAgents = officeAgents.filter(a => a.status === 'active').length;
      const totalAgents = officeAgents.length;

      // Get pending tasks count for this office
      const pendingResult = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE agent_id IN (SELECT id FROM agents WHERE office_id = ?)
        AND status = 'pending'
      `).get(officeId) as { count: number };

      // Get recent errors (last 24h)
      const errorResult = db.prepare(`
        SELECT COUNT(*) as count FROM activity_logs
        WHERE agent_id IN (SELECT id FROM agents WHERE office_id = ?)
        AND type = 'error'
        AND timestamp > datetime('now', '-24 hours')
      `).get(officeId) as { count: number };

      // Get last activity timestamp
      const lastActivity = db.prepare(`
        SELECT MAX(timestamp) as ts FROM activity_logs
        WHERE agent_id IN (SELECT id FROM agents WHERE office_id = ?)
      `).get(officeId) as { ts: string | null };

      const data = {
        activeAgents,
        totalAgents,
        pendingTasks: pendingResult.count,
        recentErrors: errorResult.count,
        lastActivityAt: lastActivity.ts,
      };

      offices[officeId] = {
        officeId,
        ...data,
        healthLevel: computeRoomHealth(data),
      };
    }

    // Check for new commits from active agents (every 60s, not every poll)
    const now = Date.now();
    if (now - lastCommitCheck > COMMIT_CHECK_INTERVAL) {
      lastCommitCheck = now;
      const agentsWithRepos = db.prepare(
        `SELECT id, github_repo FROM agents WHERE github_repo IS NOT NULL`
      ).all() as { id: string; github_repo: string }[];

      for (const agent of agentsWithRepos) {
        try {
          checkForNewCommits(agent.id, agent.github_repo);
        } catch {
          // Non-critical — don't break status endpoint
        }
      }
    }

    // Cleanup old logs/cache hourly
    if (now - lastCleanup > CLEANUP_INTERVAL) {
      lastCleanup = now;
      try { cleanupOldData(); } catch { /* non-critical */ }
    }

    // Orchestrator tick — advance workflows every poll
    try { orchestrate(); } catch { /* non-critical */ }

    // Get workflow and message data for frontend
    let activeWorkflowRuns: ReturnType<typeof getWorkflowRunSummaries> = [];
    let pendingMessageCounts: Record<string, number> = {};
    try {
      activeWorkflowRuns = getWorkflowRunSummaries();
      pendingMessageCounts = getPendingMessageCounts();
    } catch { /* non-critical */ }

    // Recent messages for send/receive flash animations
    let recentMessages: Array<{ id: number; from: string; to: string }> = [];
    try {
      recentMessages = db.prepare(`
        SELECT id, from_agent_id as 'from', to_agent_id as 'to'
        FROM agent_messages
        WHERE created_at > datetime('now', '-30 seconds')
        ORDER BY created_at DESC LIMIT 10
      `).all() as Array<{ id: number; from: string; to: string }>;
    } catch { /* non-critical */ }

    return NextResponse.json({
      agents, counts, offices, liveAgents,
      activeWorkflowRuns, pendingMessageCounts, recentMessages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch status', detail: String(error) },
      { status: 500 }
    );
  }
}
