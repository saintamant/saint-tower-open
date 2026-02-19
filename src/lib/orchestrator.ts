import { getDb } from './db';
import { getRecentCommits } from './github';
import { WorkflowStepTemplate } from '@/types/workflow';

// Orchestrator: runs every 10s from /api/status
// 1. Check completed tasks → mark workflow steps done
// 2. Advance workflows → start next pending steps
// 3. Complete workflows when all steps done
// 4. Send Telegram notifications

export function orchestrate() {
  checkCompletedSteps();
  advanceWorkflows();
  completeWorkflows();
}

// Find workflow steps where status=in_progress but linked task is completed
function checkCompletedSteps() {
  const db = getDb();

  const inProgressSteps = db.prepare(`
    SELECT ws.id, ws.workflow_run_id, ws.agent_id, ws.task_id, ws.name,
           t.status as task_status, t.result as task_result
    FROM workflow_steps ws
    LEFT JOIN tasks t ON t.id = ws.task_id
    WHERE ws.status = 'in_progress'
    AND t.status = 'completed'
  `).all() as Array<{
    id: number;
    workflow_run_id: number;
    agent_id: string;
    task_id: number;
    name: string;
    task_status: string;
    task_result: string | null;
  }>;

  for (const step of inProgressSteps) {
    // Snapshot recent commits for this agent
    let commitsJson: string | null = null;
    try {
      const agent = db.prepare('SELECT github_repo FROM agents WHERE id = ?').get(step.agent_id) as { github_repo: string } | undefined;
      if (agent?.github_repo) {
        const commits = getRecentCommits(agent.github_repo, 5);
        if (commits.length > 0) {
          commitsJson = JSON.stringify(commits.map(c => ({ sha: c.sha, message: c.message })));
        }
      }
    } catch {
      // Non-critical
    }

    // Mark step completed
    db.prepare(`
      UPDATE workflow_steps
      SET status = 'completed', result = ?, commits_json = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(step.task_result || '', commitsJson, step.id);

    // Get workflow run name for notification
    const run = db.prepare('SELECT name FROM workflow_runs WHERE id = ?').get(step.workflow_run_id) as { name: string } | undefined;
    const agentName = getAgentDisplayName(step.agent_id);

    // Log activity
    db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
      .run(step.agent_id, 'task', `Workflow step completed: ${step.name}`);

    // Telegram notification
    sendTelegramNotification(`✅ [${run?.name}] Step "${step.name}" done by ${agentName}`);
  }

  // Also check for failed tasks
  const failedSteps = db.prepare(`
    SELECT ws.id, ws.workflow_run_id, ws.name, ws.agent_id
    FROM workflow_steps ws
    LEFT JOIN tasks t ON t.id = ws.task_id
    WHERE ws.status = 'in_progress'
    AND t.status = 'failed'
  `).all() as Array<{ id: number; workflow_run_id: number; name: string; agent_id: string }>;

  for (const step of failedSteps) {
    db.prepare(`
      UPDATE workflow_steps SET status = 'failed', completed_at = datetime('now') WHERE id = ?
    `).run(step.id);

    db.prepare(`
      UPDATE workflow_runs SET status = 'failed', completed_at = datetime('now') WHERE id = ?
    `).run(step.workflow_run_id);

    const run = db.prepare('SELECT name FROM workflow_runs WHERE id = ?').get(step.workflow_run_id) as { name: string } | undefined;
    sendTelegramNotification(`❌ [${run?.name}] Step "${step.name}" failed. Check dashboard`);
  }
}

// For each running workflow, find pending steps whose deps are all completed → auto-start
function advanceWorkflows() {
  const db = getDb();

  const runningWorkflows = db.prepare(`
    SELECT wr.id, wr.workflow_id, wr.name, wr.input, w.steps_json
    FROM workflow_runs wr
    JOIN workflows w ON w.id = wr.workflow_id
    WHERE wr.status = 'running'
  `).all() as Array<{
    id: number;
    workflow_id: number;
    name: string;
    input: string | null;
    steps_json: string;
  }>;

  for (const run of runningWorkflows) {
    const stepTemplates: WorkflowStepTemplate[] = JSON.parse(run.steps_json);

    // Get current step statuses
    const steps = db.prepare(`
      SELECT id, step_order, status, result, commits_json
      FROM workflow_steps WHERE workflow_run_id = ?
    `).all(run.id) as Array<{
      id: number;
      step_order: number;
      status: string;
      result: string | null;
      commits_json: string | null;
    }>;

    const stepStatusMap = new Map(steps.map(s => [s.step_order, s]));

    // Find pending steps whose dependencies are all completed
    const pendingSteps = steps.filter(s => s.status === 'pending');

    for (const pendingStep of pendingSteps) {
      const template = stepTemplates.find(t => t.order === pendingStep.step_order);
      if (!template) continue;

      const deps = template.dependsOn || [];
      const allDepsDone = deps.every(depOrder => {
        const dep = stepStatusMap.get(depOrder);
        return dep && dep.status === 'completed';
      });

      // Also check: if no deps, only start if it's the first step or previous sequential steps done
      if (deps.length === 0 && pendingStep.step_order > 1) {
        // No explicit deps but not first step — this shouldn't happen with well-defined workflows
        // but handle it: treat as depending on the previous step
        const prev = stepStatusMap.get(pendingStep.step_order - 1);
        if (!prev || prev.status !== 'completed') continue;
      }

      if (!allDepsDone && deps.length > 0) continue;

      // Resolve task description from template
      const taskDescription = resolveTemplate(template.taskTemplate, run, stepStatusMap);

      // Create task for the agent
      const taskResult = db.prepare(
        'INSERT INTO tasks (agent_id, description, status, workflow_step_id) VALUES (?, ?, ?, ?)'
      ).run(template.agentId, taskDescription, 'pending', pendingStep.id);

      const taskId = taskResult.lastInsertRowid as number;

      // Update workflow step: link task, mark in_progress
      db.prepare(`
        UPDATE workflow_steps
        SET status = 'in_progress', task_id = ?, started_at = datetime('now')
        WHERE id = ?
      `).run(taskId, pendingStep.id);

      // Update agent current task
      db.prepare('UPDATE agents SET current_task = ? WHERE id = ?')
        .run(`[Workflow] ${template.name}`, template.agentId);

      // Send handoff message if there are completed deps
      if (deps.length > 0) {
        const depResults = deps.map(depOrder => {
          const dep = stepStatusMap.get(depOrder);
          const depTemplate = stepTemplates.find(t => t.order === depOrder);
          return `**${depTemplate?.name}:** ${dep?.result || 'No result'}`;
        }).join('\n\n');

        const depCommits = deps.flatMap(depOrder => {
          const dep = stepStatusMap.get(depOrder);
          if (!dep?.commits_json) return [];
          try { return JSON.parse(dep.commits_json); } catch { return []; }
        });

        const commitsList = depCommits.length > 0
          ? '\n\nRecent commits:\n' + depCommits.map((c: { sha: string; message: string }) => `- ${c.sha}: ${c.message}`).join('\n')
          : '';

        const handoffContent = `Handoff from previous step(s):\n\n${depResults}${commitsList}`;

        // Find a dep agent to use as "from"
        const fromAgentId = stepTemplates.find(t => t.order === deps[0])?.agentId || 'sa-main';

        db.prepare(`
          INSERT INTO agent_messages (from_agent_id, to_agent_id, content, message_type, workflow_run_id, status)
          VALUES (?, ?, ?, 'handoff', ?, 'pending')
        `).run(fromAgentId, template.agentId, handoffContent, run.id);
      }

      // Log activity
      db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
        .run(template.agentId, 'task', `Workflow step started: ${template.name}`);

      const agentName = getAgentDisplayName(template.agentId);
      sendTelegramNotification(`🔄 [${run.name}] Step "${template.name}" started → ${agentName}`);
    }
  }
}

// When all steps done → mark workflow completed
function completeWorkflows() {
  const db = getDb();

  const runningWorkflows = db.prepare(`
    SELECT id, name FROM workflow_runs WHERE status = 'running'
  `).all() as Array<{ id: number; name: string }>;

  for (const run of runningWorkflows) {
    const steps = db.prepare(`
      SELECT status FROM workflow_steps WHERE workflow_run_id = ?
    `).all(run.id) as Array<{ status: string }>;

    if (steps.length === 0) continue;

    const allDone = steps.every(s => s.status === 'completed');
    if (!allDone) continue;

    // Get workflow_id before marking completed
    const runData = db.prepare('SELECT workflow_id FROM workflow_runs WHERE id = ?').get(run.id) as { workflow_id: number } | undefined;

    db.prepare(`
      UPDATE workflow_runs SET status = 'completed', completed_at = datetime('now') WHERE id = ?
    `).run(run.id);

    // Daily Commit Vault (workflow 15) → save digest
    if (runData?.workflow_id === 15) {
      try {
        const lastStepResult = db.prepare(`
          SELECT result FROM workflow_steps
          WHERE workflow_run_id = ? ORDER BY step_order DESC LIMIT 1
        `).get(run.id) as { result: string } | undefined;
        if (lastStepResult?.result) {
          db.prepare("INSERT OR REPLACE INTO daily_digests (date, content, workflow_run_id) VALUES (date('now'), ?, ?)")
            .run(lastStepResult.result, run.id);
        }
      } catch {
        // Non-critical
      }
    }

    // Log activity
    db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
      .run('sa-main', 'task', `Workflow completed: ${run.name}`);

    sendTelegramNotification(`🎉 [${run.name}] completed! Rate it in Saint Tower`);
  }
}

// Resolve template variables
function resolveTemplate(
  template: string,
  run: { input: string | null },
  stepStatusMap: Map<number, { result: string | null; commits_json: string | null }>
): string {
  let result = template;

  // {{input}}
  result = result.replace(/\{\{input\}\}/g, run.input || '');

  // {{prev_result}} — result from the first dependency (or last completed step)
  const allSteps = [...stepStatusMap.entries()].sort(([a], [b]) => a - b);
  const completedSteps = allSteps.filter(([, s]) => s.result);
  const lastCompleted = completedSteps[completedSteps.length - 1];
  result = result.replace(/\{\{prev_result\}\}/g, lastCompleted?.[1]?.result || '');

  // {{prev_commits}}
  if (lastCompleted?.[1]?.commits_json) {
    try {
      const commits = JSON.parse(lastCompleted[1].commits_json) as Array<{ sha: string; message: string }>;
      const formatted = commits.map(c => `- ${c.sha}: ${c.message}`).join('\n');
      result = result.replace(/\{\{prev_commits\}\}/g, formatted);
    } catch {
      result = result.replace(/\{\{prev_commits\}\}/g, 'None');
    }
  } else {
    result = result.replace(/\{\{prev_commits\}\}/g, 'None');
  }

  // {{step_N_result}}
  result = result.replace(/\{\{step_(\d+)_result\}\}/g, (_match, stepNum) => {
    const step = stepStatusMap.get(parseInt(stepNum));
    return step?.result || '';
  });

  return result;
}

function getAgentDisplayName(agentId: string): string {
  const db = getDb();
  const agent = db.prepare('SELECT display_name FROM agents WHERE id = ?').get(agentId) as { display_name: string } | undefined;
  return agent?.display_name || agentId;
}

// Send Telegram notification via clawdbot (fire-and-forget)
async function sendTelegramNotification(text: string) {
  try {
    const { clawdbot } = await import('./clawdbot');
    await clawdbot.sendMessage('juan', text);
  } catch {
    // Non-critical — Telegram might not be available
  }
}

// Get workflow run summaries for the status endpoint
export function getWorkflowRunSummaries() {
  const db = getDb();

  const runs = db.prepare(`
    SELECT wr.id, wr.name, wr.status, wr.started_at
    FROM workflow_runs wr
    WHERE wr.status IN ('running', 'paused')
    ORDER BY wr.started_at DESC
  `).all() as Array<{
    id: number;
    name: string;
    status: string;
    started_at: string;
  }>;

  return runs.map(run => {
    const steps = db.prepare(`
      SELECT step_order, name, agent_id, status
      FROM workflow_steps WHERE workflow_run_id = ?
      ORDER BY step_order
    `).all(run.id) as Array<{
      step_order: number;
      name: string;
      agent_id: string;
      status: string;
    }>;

    const currentStep = steps.find(s => s.status === 'in_progress');

    return {
      id: run.id,
      name: run.name,
      status: run.status,
      totalSteps: steps.length,
      completedSteps: steps.filter(s => s.status === 'completed').length,
      currentStepName: currentStep?.name,
      currentAgentId: currentStep?.agent_id,
      startedAt: run.started_at,
    };
  });
}

// Get pending message counts per agent
export function getPendingMessageCounts(): Record<string, number> {
  const db = getDb();

  const rows = db.prepare(`
    SELECT to_agent_id, COUNT(*) as count
    FROM agent_messages
    WHERE status = 'pending'
    GROUP BY to_agent_id
  `).all() as Array<{ to_agent_id: string; count: number }>;

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.to_agent_id] = row.count;
  }
  return counts;
}
