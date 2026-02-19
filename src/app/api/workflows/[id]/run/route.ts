import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { startWorkflowRun } from '@/lib/workflowRunner';

// POST /api/workflows/:id/run — start a workflow run
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { input } = body;

    const { runId, workflowName, stepCount } = startWorkflowRun(parseInt(id), input, 'juan');

    // Send Telegram notification
    try {
      const { clawdbot } = await import('@/lib/clawdbot');
      await clawdbot.sendMessage('juan', `🚀 Workflow "${workflowName}" started with ${stepCount} steps`);
    } catch {
      // Non-critical
    }

    // Return the run
    const db = getDb();
    const run = db.prepare('SELECT * FROM workflow_runs WHERE id = ?').get(runId);
    const runSteps = db.prepare('SELECT * FROM workflow_steps WHERE workflow_run_id = ? ORDER BY step_order').all(runId);

    return NextResponse.json({ run, steps: runSteps });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start workflow', detail: String(error) },
      { status: 500 }
    );
  }
}
