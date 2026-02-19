import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

// GET /api/workflow-runs — list workflow runs
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    seedData();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = `
      SELECT wr.*, w.description as workflow_description
      FROM workflow_runs wr
      JOIN workflows w ON w.id = wr.workflow_id
    `;
    const params: (string | number)[] = [];

    if (status) {
      query += ' WHERE wr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY wr.started_at DESC LIMIT ?';
    params.push(limit);

    const runs = db.prepare(query).all(...params) as Array<{
      id: number;
      workflow_id: number;
      name: string;
      input: string | null;
      status: string;
      rating: number | null;
      rating_notes: string | null;
      retro_result: string | null;
      started_at: string;
      completed_at: string | null;
      started_by: string;
      workflow_description: string;
    }>;

    // Enrich each run with step summaries
    const result = runs.map(run => {
      const steps = db.prepare(`
        SELECT ws.*, a.display_name as agent_display_name
        FROM workflow_steps ws
        LEFT JOIN agents a ON a.id = ws.agent_id
        WHERE ws.workflow_run_id = ?
        ORDER BY ws.step_order
      `).all(run.id) as Array<{
        id: number;
        step_order: number;
        name: string;
        agent_id: string;
        agent_display_name: string;
        status: string;
        started_at: string | null;
        completed_at: string | null;
      }>;

      const currentStep = steps.find(s => s.status === 'in_progress');

      return {
        ...run,
        totalSteps: steps.length,
        completedSteps: steps.filter(s => s.status === 'completed').length,
        currentStepName: currentStep?.name,
        currentAgentName: currentStep?.agent_display_name,
        steps,
      };
    });

    return NextResponse.json({ runs: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workflow runs', detail: String(error) },
      { status: 500 }
    );
  }
}
