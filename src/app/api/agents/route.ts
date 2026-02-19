import { NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    seedData();
    const agents = db.prepare(`
      SELECT a.id, a.name, a.display_name as displayName, a.role, a.office_id as officeId,
             a.openclaw_session_id as openclawSessionId, a.github_repo as githubRepo,
             a.status, a.current_task as currentTask,
             a.sprite_color as spriteColor, a.last_activity_at as lastActivityAt,
             a.position_x as positionX, a.position_y as positionY,
             COALESCE(tp.cnt, 0) as pendingTaskCount,
             COALESCE(te.cnt, 0) as errorCount
      FROM agents a
      LEFT JOIN (
        SELECT agent_id, COUNT(*) as cnt FROM tasks WHERE status = 'pending' GROUP BY agent_id
      ) tp ON tp.agent_id = a.id
      LEFT JOIN (
        SELECT agent_id, COUNT(*) as cnt FROM activity_logs
        WHERE type = 'error' AND timestamp > datetime('now', '-24 hours')
        GROUP BY agent_id
      ) te ON te.agent_id = a.id
      ORDER BY a.office_id, a.name
    `).all();
    return NextResponse.json({ agents });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents', detail: String(error) },
      { status: 500 }
    );
  }
}
