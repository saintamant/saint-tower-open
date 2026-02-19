import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const DESKTOP = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop');

const REPO_TO_FOLDER: Record<string, string> = {
  'demo-org/analytics': 'demo-analytics',
  'ProjectA-demo/Agent-A1': 'ProjectA',
  'ProjectA-demo/Agent-A2': 'ProjectA-ML',
  'ProjectB-demo/Agent-B1': 'ProjectB',
  'ProjectB-demo/Agent-B2': 'ProjectB-Logistics',
  'ProjectC-demo/Agent-C1': 'ProjectC',
  'ProjectC-demo/Agent-C2': 'ProjectC-Config',
  'ProjectD-demo/Agent-D1': 'ProjectD',
  'ProjectE-demo/BackEnd': 'ProjectE',
  'ProjectE-demo/FrontEnd': 'ProjectE',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    seedData();

    const agent = db.prepare('SELECT github_repo FROM agents WHERE id = ?').get(id) as { github_repo?: string } | undefined;
    if (!agent || !agent.github_repo) {
      return NextResponse.json({ error: 'Agent not found or no repo' }, { status: 404 });
    }

    const folder = REPO_TO_FOLDER[agent.github_repo];
    if (!folder) {
      return NextResponse.json({ error: 'No local folder mapping for repo' }, { status: 404 });
    }

    const repoPath = path.join(DESKTOP, folder);
    const { searchParams } = new URL(request.url);
    const dashboard = searchParams.get('dashboard');
    const basePath = searchParams.get('path') || 'Dashboards';

    if (dashboard) {
      const dashPath = path.join(repoPath, basePath, dashboard);

      let readme = '';
      let changelog = '';
      try { readme = fs.readFileSync(path.join(dashPath, 'README.md'), 'utf-8'); } catch { /* no file */ }
      try { changelog = fs.readFileSync(path.join(dashPath, 'CHANGELOG.md'), 'utf-8'); } catch { /* no file */ }

      return NextResponse.json({ dashboard, readme, changelog });
    } else {
      const listPath = path.join(repoPath, basePath);

      if (!fs.existsSync(listPath)) {
        return NextResponse.json({ dashboards: [] });
      }

      const entries = fs.readdirSync(listPath, { withFileTypes: true });
      const dashboards = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('_'))
        .map(e => {
          const dPath = path.join(listPath, e.name);
          return {
            name: e.name,
            hasReadme: fs.existsSync(path.join(dPath, 'README.md')),
            hasChangelog: fs.existsSync(path.join(dPath, 'CHANGELOG.md')),
          };
        });

      return NextResponse.json({ dashboards });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch library', detail: String(error) },
      { status: 500 }
    );
  }
}
