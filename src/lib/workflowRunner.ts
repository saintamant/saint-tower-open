import { getDb, seedData } from './db';
import { WorkflowStepTemplate } from '@/types/workflow';

export function startWorkflowRun(
  workflowId: number,
  input?: string,
  startedBy?: string
): { runId: number; workflowName: string; stepCount: number } {
  const db = getDb();
  seedData();

  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId) as {
    id: number;
    name: string;
    description: string;
    steps_json: string;
  } | undefined;

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  const steps: WorkflowStepTemplate[] = JSON.parse(workflow.steps_json);

  // Create workflow run
  const runResult = db.prepare(`
    INSERT INTO workflow_runs (workflow_id, name, input, status, started_by)
    VALUES (?, ?, ?, 'running', ?)
  `).run(workflow.id, workflow.name, input || null, startedBy || 'system');

  const runId = runResult.lastInsertRowid as number;

  // Create all workflow steps
  const insertStep = db.prepare(`
    INSERT INTO workflow_steps (workflow_run_id, step_order, name, agent_id, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);

  for (const step of steps) {
    insertStep.run(runId, step.order, step.name, step.agentId);
  }

  // Log activity
  db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
    .run(startedBy || 'system', 'task', `Workflow started: ${workflow.name}`);

  // Kick-start first step(s) immediately
  const firstSteps = steps.filter(s => !s.dependsOn || s.dependsOn.length === 0);
  for (const step of firstSteps) {
    let taskDescription = step.taskTemplate.replace(/\{\{input\}\}/g, input || '');
    taskDescription = taskDescription.replace(/\{\{prev_result\}\}/g, '');
    taskDescription = taskDescription.replace(/\{\{prev_commits\}\}/g, 'None');

    const taskResult = db.prepare(
      'INSERT INTO tasks (agent_id, description, status, workflow_step_id) VALUES (?, ?, ?, ?)'
    ).run(step.agentId, taskDescription, 'pending', null);

    const taskId = taskResult.lastInsertRowid as number;

    const wsRow = db.prepare(`
      SELECT id FROM workflow_steps
      WHERE workflow_run_id = ? AND step_order = ?
    `).get(runId, step.order) as { id: number };

    db.prepare(`
      UPDATE workflow_steps
      SET status = 'in_progress', task_id = ?, started_at = datetime('now')
      WHERE id = ?
    `).run(taskId, wsRow.id);

    db.prepare('UPDATE tasks SET workflow_step_id = ? WHERE id = ?').run(wsRow.id, taskId);

    db.prepare('UPDATE agents SET current_task = ? WHERE id = ?')
      .run(`[Workflow] ${step.name}`, step.agentId);
  }

  return { runId, workflowName: workflow.name, stepCount: steps.length };
}
