import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// PATCH /api/workflow-runs/:id/steps/:stepId — mark complete/fail manually
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id, stepId } = await params;
    const db = getDb();
    const body = await request.json();
    const { status, result } = body;

    if (!status || !['completed', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify step belongs to run
    const step = db.prepare(`
      SELECT * FROM workflow_steps WHERE id = ? AND workflow_run_id = ?
    `).get(parseInt(stepId), parseInt(id)) as Record<string, unknown> | undefined;

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    db.prepare(`
      UPDATE workflow_steps
      SET status = ?, result = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(status, result || null, parseInt(stepId));

    // If failed, also fail the workflow run
    if (status === 'failed') {
      db.prepare("UPDATE workflow_runs SET status = 'failed', completed_at = datetime('now') WHERE id = ?")
        .run(parseInt(id));
    }

    const updated = db.prepare('SELECT * FROM workflow_steps WHERE id = ?').get(parseInt(stepId));
    return NextResponse.json({ step: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update step', detail: String(error) },
      { status: 500 }
    );
  }
}
