import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';
import { launchAgent } from '@/lib/launcher';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();
    seedData();

    const { message, description, type, wait } = body;
    const taskText = description || message || '';

    if (!taskText) {
      return NextResponse.json({ error: 'No message or description provided' }, { status: 400 });
    }

    // Save task to DB
    const result = db.prepare(
      'INSERT INTO tasks (agent_id, description, status) VALUES (?, ?, ?)'
    ).run(id, taskText, 'pending');

    const taskId = result.lastInsertRowid;
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    // Log activity
    db.prepare(
      'INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)'
    ).run(id, type === 'task' ? 'task' : 'message', taskText);

    // Update agent current task
    db.prepare('UPDATE agents SET current_task = ?, status = ? WHERE id = ?')
      .run(taskText, 'active', id);

    // Auto-launch terminal with the task
    let launched = false;
    try {
      launchAgent(id, { task: taskText });
      launched = true;
    } catch {
      // Launch failed — task is still saved, can be launched manually
    }

    // If wait=true, poll until task is completed (up to 90s)
    if (wait && launched) {
      const deadline = Date.now() + 90_000;
      while (Date.now() < deadline) {
        await sleep(5000);
        const current = db.prepare(
          'SELECT status, result FROM tasks WHERE id = ?'
        ).get(taskId) as { status: string; result: string | null } | undefined;
        if (current?.status === 'completed') {
          return NextResponse.json({ task: { ...task, status: 'completed', result: current.result }, launched });
        }
      }
    }

    return NextResponse.json({ task, launched });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task', detail: String(error) },
      { status: 500 }
    );
  }
}
