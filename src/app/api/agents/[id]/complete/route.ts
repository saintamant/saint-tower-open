import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/agents/:id/complete — report task completion (from terminal-server DONE.md detection)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const { result, commits } = body;

    // Find the agent's in-progress workflow task
    const activeStep = db.prepare(`
      SELECT ws.id as step_id, ws.workflow_run_id, ws.task_id
      FROM workflow_steps ws
      JOIN tasks t ON t.id = ws.task_id
      WHERE ws.agent_id = ?
      AND ws.status = 'in_progress'
      AND t.status IN ('pending', 'in_progress')
      LIMIT 1
    `).get(id) as { step_id: number; workflow_run_id: number; task_id: number } | undefined;

    if (!activeStep) {
      // No active workflow task — update the latest pending/in-progress task
      const task = db.prepare(`
        SELECT id FROM tasks WHERE agent_id = ? AND status IN ('pending', 'in_progress') ORDER BY id DESC LIMIT 1
      `).get(id) as { id: number } | undefined;

      if (task) {
        db.prepare(`
          UPDATE tasks SET status = 'completed', result = ?, completed_at = datetime('now') WHERE id = ?
        `).run(result || '', task.id);
        db.prepare('UPDATE agents SET current_task = NULL, status = ? WHERE id = ?').run('idle', id);
        db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
          .run(id, 'task', `Task completed: ${(result || '').slice(0, 100)}`);
      }

      // Send result to Telegram (graceful failure if not configured)
      if (result) {
        try {
          const agent = db.prepare('SELECT display_name FROM agents WHERE id = ?').get(id) as { display_name: string } | undefined;
          const agentName = agent?.display_name || id;
          const truncated = result.length > 3000 ? result.slice(0, 3000) + '...' : result;
          const { clawdbot } = await import('@/lib/clawdbot');
          await clawdbot.sendMessage('admin', `${agentName} completed task:\n\n${truncated}`);
        } catch { /* Telegram not available */ }
      }

      return NextResponse.json({ success: true, workflowStep: false });
    }

    // Mark task completed
    db.prepare(`
      UPDATE tasks SET status = 'completed', result = ?, completed_at = datetime('now') WHERE id = ?
    `).run(result || '', activeStep.task_id);

    // Mark workflow step completed with commits
    const commitsJson = commits ? JSON.stringify(commits) : null;
    db.prepare(`
      UPDATE workflow_steps
      SET status = 'completed', result = ?, commits_json = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(result || '', commitsJson, activeStep.step_id);

    // Clear agent current task and reset status
    db.prepare('UPDATE agents SET current_task = NULL, status = ? WHERE id = ?').run('idle', id);

    // Log activity
    db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
      .run(id, 'task', 'Task completed via DONE.md');

    // Send result to Telegram (graceful failure if not configured)
    if (result) {
      try {
        const agent = db.prepare('SELECT display_name FROM agents WHERE id = ?').get(id) as { display_name: string } | undefined;
        const agentName = agent?.display_name || id;
        const truncated = result.length > 3000 ? result.slice(0, 3000) + '...' : result;
        const { clawdbot } = await import('@/lib/clawdbot');
        await clawdbot.sendMessage('admin', `${agentName} completed task:\n\n${truncated}`);
      } catch { /* Telegram not available */ }
    }

    return NextResponse.json({ success: true, workflowStep: true, stepId: activeStep.step_id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to report completion', detail: String(error) },
      { status: 500 }
    );
  }
}
