import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

// POST /api/activity — insert activity log (used by demo simulator)
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    seedData();
    const { agentId, type, content } = await request.json();

    if (!agentId || !type) {
      return NextResponse.json({ error: 'agentId and type required' }, { status: 400 });
    }

    db.prepare(
      'INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)'
    ).run(agentId, type, content || '');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create activity', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    seedData();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const since = searchParams.get('since');

    let query = `
      SELECT al.id, al.agent_id as agentId, al.type, al.content, al.timestamp,
             a.display_name as agentDisplayName, a.office_id as officeId
      FROM activity_logs al
      LEFT JOIN agents a ON al.agent_id = a.id
    `;

    const params: (string | number)[] = [];
    if (since) {
      query += ' WHERE al.timestamp > ?';
      params.push(since);
    }

    query += ' ORDER BY al.timestamp DESC LIMIT ?';
    params.push(limit);

    const activities = db.prepare(query).all(...params);

    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activity', detail: String(error) },
      { status: 500 }
    );
  }
}
