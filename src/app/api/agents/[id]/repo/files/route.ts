import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';
import { getRepoTree, getFileContent } from '@/lib/github';

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

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    const mode = searchParams.get('mode') || 'list';

    if (mode === 'content') {
      const content = getFileContent(agent.github_repo, path);
      return NextResponse.json({ content, path });
    }

    const files = getRepoTree(agent.github_repo, path);
    return NextResponse.json({ files, path });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch files', detail: String(error) },
      { status: 500 }
    );
  }
}
