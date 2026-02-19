import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

// GET /api/messages — list messages with optional filters
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    seedData();

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const workflowRunId = searchParams.get('workflow_run_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = `
      SELECT m.*,
        fa.display_name as from_agent_name,
        ta.display_name as to_agent_name
      FROM agent_messages m
      LEFT JOIN agents fa ON fa.id = m.from_agent_id
      LEFT JOIN agents ta ON ta.id = m.to_agent_id
    `;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (agentId) {
      conditions.push('(m.from_agent_id = ? OR m.to_agent_id = ?)');
      params.push(agentId, agentId);
    }
    if (workflowRunId) {
      conditions.push('m.workflow_run_id = ?');
      params.push(parseInt(workflowRunId));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(limit);

    const messages = db.prepare(query).all(...params);

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch messages', detail: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/messages — send inter-agent message
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    seedData();

    const body = await request.json();
    const { fromAgentId, toAgentId, content, messageType, workflowRunId, inReplyTo } = body;

    if (!fromAgentId || !toAgentId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate same-office: agents can only message within their office
    const fromAgent = db.prepare('SELECT id, office_id FROM agents WHERE id = ?').get(fromAgentId) as { id: string; office_id: string } | undefined;
    const toAgent = db.prepare('SELECT id, office_id FROM agents WHERE id = ?').get(toAgentId) as { id: string; office_id: string } | undefined;

    if (!fromAgent || !toAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (fromAgent.office_id !== toAgent.office_id) {
      return NextResponse.json(
        { error: `Cross-office messaging not allowed: ${fromAgentId} (${fromAgent.office_id}) → ${toAgentId} (${toAgent.office_id})` },
        { status: 403 }
      );
    }

    const result = db.prepare(`
      INSERT INTO agent_messages (from_agent_id, to_agent_id, content, message_type, workflow_run_id, in_reply_to)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(fromAgentId, toAgentId, content, messageType || 'message', workflowRunId || null, inReplyTo || null);

    const message = db.prepare('SELECT * FROM agent_messages WHERE id = ?').get(result.lastInsertRowid);

    // Log activity
    const fromName = (db.prepare('SELECT display_name FROM agents WHERE id = ?').get(fromAgentId) as { display_name: string })?.display_name || fromAgentId;
    const toName = (db.prepare('SELECT display_name FROM agents WHERE id = ?').get(toAgentId) as { display_name: string })?.display_name || toAgentId;
    db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
      .run(fromAgentId, 'message', `${fromName} → ${toName}: ${content.slice(0, 100)}`);

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message', detail: String(error) },
      { status: 500 }
    );
  }
}
