import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

// POST /api/workflows — create new workflow template
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, description, steps } = body;

    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Name and steps are required' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO workflows (name, description, steps_json) VALUES (?, ?, ?)'
    ).run(name, description || null, JSON.stringify(steps));

    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;

    return NextResponse.json({
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        steps: JSON.parse(workflow.steps_json as string),
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create workflow', detail: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/workflows — list workflow templates
export async function GET() {
  try {
    const db = getDb();
    seedData();

    const workflows = db.prepare(`
      SELECT id, name, description, steps_json, created_at, cron_expression, schedule_enabled, office_id
      FROM workflows ORDER BY id
    `).all() as Array<{
      id: number;
      name: string;
      description: string;
      steps_json: string;
      created_at: string;
      cron_expression: string | null;
      schedule_enabled: number | null;
      office_id: string | null;
    }>;

    const result = workflows.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      officeId: w.office_id || 'sa-core',
      cronExpression: w.cron_expression || undefined,
      scheduleEnabled: w.schedule_enabled !== 0,
      steps: JSON.parse(w.steps_json),
      createdAt: w.created_at,
    }));

    return NextResponse.json({ workflows: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workflows', detail: String(error) },
      { status: 500 }
    );
  }
}
