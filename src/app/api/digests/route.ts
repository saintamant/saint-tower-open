import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/digests?limit=30&date=2026-02-18
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (date) {
      const digest = db.prepare(
        'SELECT id, date, content, workflow_run_id, created_at FROM daily_digests WHERE date = ?'
      ).get(date) as { id: number; date: string; content: string; workflow_run_id: number; created_at: string } | undefined;

      if (!digest) {
        return NextResponse.json({ error: 'No digest for this date' }, { status: 404 });
      }
      return NextResponse.json({ digest });
    }

    const digests = db.prepare(
      'SELECT id, date, content, workflow_run_id, created_at FROM daily_digests ORDER BY date DESC LIMIT ?'
    ).all(Math.min(limit, 100)) as Array<{
      id: number;
      date: string;
      content: string;
      workflow_run_id: number;
      created_at: string;
    }>;

    return NextResponse.json({ digests });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch digests', detail: String(error) },
      { status: 500 }
    );
  }
}
