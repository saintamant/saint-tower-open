import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';
import { getRepoInfo } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    seedData();

    const agent = db.prepare('SELECT github_repo FROM agents WHERE id = ?').get(id) as { github_repo: string | null } | undefined;
    if (!agent || !agent.github_repo) {
      return NextResponse.json({ error: 'Agent has no linked repo' }, { status: 404 });
    }

    const repo = getRepoInfo(agent.github_repo);
    return NextResponse.json({ repo });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch repo info', detail: String(error) },
      { status: 500 }
    );
  }
}
