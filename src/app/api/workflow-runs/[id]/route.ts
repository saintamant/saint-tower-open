import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/workflow-runs/:id — full run with steps + messages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const run = db.prepare(`
      SELECT wr.*, w.steps_json as workflow_steps_json
      FROM workflow_runs wr
      JOIN workflows w ON w.id = wr.workflow_id
      WHERE wr.id = ?
    `).get(parseInt(id)) as Record<string, unknown> | undefined;

    if (!run) {
      return NextResponse.json({ error: 'Workflow run not found' }, { status: 404 });
    }

    const steps = db.prepare(`
      SELECT ws.*, a.display_name as agent_display_name
      FROM workflow_steps ws
      LEFT JOIN agents a ON a.id = ws.agent_id
      WHERE ws.workflow_run_id = ?
      ORDER BY ws.step_order
    `).all(parseInt(id));

    const messages = db.prepare(`
      SELECT m.*, fa.display_name as from_agent_name, ta.display_name as to_agent_name
      FROM agent_messages m
      LEFT JOIN agents fa ON fa.id = m.from_agent_id
      LEFT JOIN agents ta ON ta.id = m.to_agent_id
      WHERE m.workflow_run_id = ?
      ORDER BY m.created_at
    `).all(parseInt(id));

    return NextResponse.json({ run, steps, messages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workflow run', detail: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/workflow-runs/:id — pause/cancel/rate
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const { action, rating, ratingNotes } = body;

    const runId = parseInt(id);
    const run = db.prepare('SELECT * FROM workflow_runs WHERE id = ?').get(runId) as {
      id: number;
      name: string;
      status: string;
    } | undefined;

    if (!run) {
      return NextResponse.json({ error: 'Workflow run not found' }, { status: 404 });
    }

    if (action === 'pause') {
      db.prepare("UPDATE workflow_runs SET status = 'paused' WHERE id = ?").run(runId);
    } else if (action === 'resume') {
      db.prepare("UPDATE workflow_runs SET status = 'running' WHERE id = ?").run(runId);
    } else if (action === 'cancel') {
      db.prepare("UPDATE workflow_runs SET status = 'cancelled', completed_at = datetime('now') WHERE id = ?").run(runId);
      // Also cancel in-progress steps
      db.prepare("UPDATE workflow_steps SET status = 'failed', completed_at = datetime('now') WHERE workflow_run_id = ? AND status IN ('pending', 'in_progress')").run(runId);
    } else if (action === 'rate') {
      db.prepare('UPDATE workflow_runs SET rating = ?, rating_notes = ? WHERE id = ?')
        .run(rating || null, ratingNotes || null, runId);

      // If rated, create retrospective task for PM agent (sa-main)
      if (rating) {
        const steps = db.prepare(`
          SELECT name, result FROM workflow_steps WHERE workflow_run_id = ? ORDER BY step_order
        `).all(runId) as Array<{ name: string; result: string | null }>;

        const stepSummary = steps.map(s => `- ${s.name}: ${(s.result || 'No result').slice(0, 200)}`).join('\n');

        const retroTask = `Analyze this completed workflow run and suggest improvements:
- Workflow: ${run.name}
- Rating: ${rating}/5
- Notes: "${ratingNotes || 'No notes'}"
- Step results:
${stepSummary}

Suggest specific changes to the workflow template.`;

        db.prepare('INSERT INTO tasks (agent_id, description, status, source_agent_id) VALUES (?, ?, ?, ?)')
          .run('sa-main', retroTask, 'pending', 'juan');
      }
    }

    const updated = db.prepare('SELECT * FROM workflow_runs WHERE id = ?').get(runId);
    return NextResponse.json({ run: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update workflow run', detail: String(error) },
      { status: 500 }
    );
  }
}
