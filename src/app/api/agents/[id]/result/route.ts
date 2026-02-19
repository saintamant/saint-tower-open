import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GET /api/agents/:id/result — get the latest task result
// ?wait=true — poll until completed (up to 90s)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    seedData();

    const { searchParams } = new URL(request.url);
    const shouldWait = searchParams.get('wait') === 'true';
    const maxWait = Math.min(parseInt(searchParams.get('timeout') || '90'), 120);

    const getTask = () => db.prepare(`
      SELECT id, description, status, result, created_at as createdAt, completed_at as completedAt
      FROM tasks WHERE agent_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(id) as {
      id: number;
      description: string;
      status: string;
      result: string | null;
      createdAt: string;
      completedAt: string | null;
    } | undefined;

    let task = getTask();

    if (!task) {
      return NextResponse.json({ error: 'No tasks found for agent' }, { status: 404 });
    }

    // Poll if wait=true and task is not yet completed
    if (shouldWait && task.status !== 'completed') {
      const deadline = Date.now() + maxWait * 1000;
      while (Date.now() < deadline) {
        await sleep(5000);
        task = getTask();
        if (!task || task.status === 'completed') break;
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch result', detail: String(error) },
      { status: 500 }
    );
  }
}
