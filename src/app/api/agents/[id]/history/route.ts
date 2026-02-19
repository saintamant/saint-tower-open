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

    const logs = db.prepare(`
      SELECT id, agent_id as agentId, type, content, timestamp
      FROM activity_logs WHERE agent_id = ? ORDER BY timestamp DESC LIMIT 50
    `).all(id);

    // Convert logs to message format for chat
    const messages = (logs as Record<string, unknown>[]).reverse().map((log) => ({
      id: String(log.id),
      from: log.type === 'message' ? 'Saint' : String(log.agentId),
      text: String(log.content),
      timestamp: String(log.timestamp),
      isUser: log.type === 'message',
    }));

    return NextResponse.json({ messages, logs });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch history', detail: String(error) },
      { status: 500 }
    );
  }
}
