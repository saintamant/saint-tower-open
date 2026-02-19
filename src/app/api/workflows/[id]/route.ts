import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

// GET /api/workflows/:id — single workflow template
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    seedData();

    const workflow = db.prepare(`
      SELECT id, name, description, steps_json, created_at
      FROM workflows WHERE id = ?
    `).get(parseInt(id)) as {
      id: number;
      name: string;
      description: string;
      steps_json: string;
      created_at: string;
    } | undefined;

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        steps: JSON.parse(workflow.steps_json),
        createdAt: workflow.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workflow', detail: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/workflows/:id — update workflow template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const { name, description, steps } = body;

    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Name and steps are required' }, { status: 400 });
    }

    const workflowId = parseInt(id);
    const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(workflowId);
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    db.prepare('UPDATE workflows SET name = ?, description = ?, steps_json = ? WHERE id = ?')
      .run(name, description || null, JSON.stringify(steps), workflowId);

    return NextResponse.json({
      workflow: { id: workflowId, name, description, steps },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update workflow', detail: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/:id — delete workflow template (only if no active runs)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const workflowId = parseInt(id);

    const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(workflowId);
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check for active runs
    const activeRun = db.prepare(
      "SELECT id FROM workflow_runs WHERE workflow_id = ? AND status IN ('running', 'paused') LIMIT 1"
    ).get(workflowId);

    if (activeRun) {
      return NextResponse.json(
        { error: 'Cannot delete workflow with active runs' },
        { status: 409 }
      );
    }

    db.prepare('DELETE FROM workflows WHERE id = ?').run(workflowId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete workflow', detail: String(error) },
      { status: 500 }
    );
  }
}
