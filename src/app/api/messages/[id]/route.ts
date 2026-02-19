import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// PATCH /api/messages/:id — mark delivered/read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const { status } = body;

    if (!status || !['delivered', 'read'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates: string[] = [`status = '${status}'`];
    if (status === 'delivered') {
      updates.push("delivered_at = datetime('now')");
    }

    db.prepare(`UPDATE agent_messages SET ${updates.join(', ')} WHERE id = ?`).run(parseInt(id));

    const message = db.prepare('SELECT * FROM agent_messages WHERE id = ?').get(parseInt(id));
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update message', detail: String(error) },
      { status: 500 }
    );
  }
}
