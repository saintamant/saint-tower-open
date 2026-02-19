import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    seedData();

    const agent = db.prepare(`
      SELECT id, name, display_name as displayName, role, office_id as officeId,
             openclaw_session_id as openclawSessionId, github_repo as githubRepo,
             claude_md as claudeMd,
             status, current_task as currentTask,
             sprite_color as spriteColor, last_activity_at as lastActivityAt
      FROM agents WHERE id = ?
    `).get(id);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const tasks = db.prepare(`
      SELECT id, agent_id as agentId, description, status, result,
             created_at as createdAt, completed_at as completedAt
      FROM tasks WHERE agent_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(id);

    return NextResponse.json({ agent, tasks });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agent', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    if (body.status) {
      // Detect meaningful transitions for activity logging
      const prev = db.prepare('SELECT status FROM agents WHERE id = ?').get(id) as { status: string } | undefined;
      db.prepare('UPDATE agents SET status = ?, last_activity_at = datetime(\'now\') WHERE id = ?').run(body.status, id);

      if (body.status === 'offline' && prev && prev.status !== 'offline') {
        db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
          .run(id, 'session', 'Sesión finalizada');
      }
    }
    if (body.currentTask !== undefined) {
      db.prepare('UPDATE agents SET current_task = ? WHERE id = ?').run(body.currentTask, id);
    }
    if (body.claudeMd !== undefined) {
      db.prepare('UPDATE agents SET claude_md = ? WHERE id = ?').run(body.claudeMd, id);
    }
    if (body.positionX !== undefined && body.positionY !== undefined) {
      db.prepare('UPDATE agents SET position_x = ?, position_y = ? WHERE id = ?').run(body.positionX, body.positionY, id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent', detail: String(error) },
      { status: 500 }
    );
  }
}
