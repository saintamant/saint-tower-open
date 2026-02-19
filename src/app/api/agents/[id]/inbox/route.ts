import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

// GET /api/agents/:id/inbox — agent's pending messages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    seedData();

    const messages = db.prepare(`
      SELECT m.*,
        fa.display_name as from_agent_name,
        ta.display_name as to_agent_name
      FROM agent_messages m
      LEFT JOIN agents fa ON fa.id = m.from_agent_id
      LEFT JOIN agents ta ON ta.id = m.to_agent_id
      WHERE m.to_agent_id = ?
      ORDER BY m.created_at DESC
      LIMIT 50
    `).all(id);

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inbox', detail: String(error) },
      { status: 500 }
    );
  }
}
