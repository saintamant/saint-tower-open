import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';
import { getRecentCommits } from '@/lib/github';

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
             status, current_task as currentTask, claude_md as claudeMd,
             github_repo as githubRepo
      FROM agents WHERE id = ?
    `).get(id) as {
      id: string;
      name: string;
      displayName: string;
      role: string;
      officeId: string;
      status: string;
      currentTask: string | null;
      claudeMd: string | null;
      githubRepo: string | null;
    } | undefined;

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const recentTasks = db.prepare(`
      SELECT description, status, result, created_at as createdAt, completed_at as completedAt
      FROM tasks WHERE agent_id = ? ORDER BY created_at DESC LIMIT 10
    `).all(id);

    let recentCommits: Array<{ sha: string; message: string; author: string; date: string }> = [];
    if (agent.githubRepo) {
      recentCommits = getRecentCommits(agent.githubRepo, 10);
    }

    const recentActivity = db.prepare(`
      SELECT type, content, timestamp
      FROM activity_logs WHERE agent_id = ? ORDER BY timestamp DESC LIMIT 15
    `).all(id);

    return NextResponse.json({
      agent: {
        id: agent.id,
        displayName: agent.displayName,
        role: agent.role,
        officeId: agent.officeId,
        status: agent.status,
        currentTask: agent.currentTask,
      },
      recentTasks,
      recentCommits,
      recentActivity,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agent context', detail: String(error) },
      { status: 500 }
    );
  }
}
