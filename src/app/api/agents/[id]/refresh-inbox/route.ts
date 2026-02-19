import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const DESKTOP = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop');

const REPO_TO_FOLDER: Record<string, string> = {
  'demo-org/saint-tower': '../saint-tower',
  'demo-org/analytics': 'demo-analytics',
  'demo-org/marketing': 'demo-marketing',
  'demo-org/sales': 'demo-sales',
  'demo-org/proposals': 'demo-proposals',
  'demo-org/market-bot': '../market-bot',
  'ProjectA-demo/Agent-A1': 'ProjectA',
  'ProjectA-demo/Agent-A2': 'ProjectA-ML',
  'ProjectB-demo/Agent-B1': 'ProjectB',
  'ProjectB-demo/Agent-B2': 'ProjectB-Logistics',
  'ProjectC-demo/Agent-C1': 'ProjectC',
  'ProjectC-demo/Agent-C2': 'ProjectC-Config',
  'ProjectD-demo/Agent-D1': 'ProjectD',
  'ProjectE-demo/BackEnd': 'ProjectE',
  'ProjectE-demo/FrontEnd': 'ProjectE',
  'demo-org/certifications': 'demo-certifications',
};

// POST /api/agents/:id/refresh-inbox — write INBOX.md to agent's cwd
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const agent = db.prepare('SELECT github_repo, display_name FROM agents WHERE id = ?').get(id) as {
      github_repo: string | null;
      display_name: string;
    } | undefined;

    if (!agent?.github_repo) {
      return NextResponse.json({ error: 'Agent has no repo configured' }, { status: 400 });
    }

    const folderName = REPO_TO_FOLDER[agent.github_repo];
    if (!folderName) {
      return NextResponse.json({ error: 'No folder mapping for repo' }, { status: 400 });
    }

    const cwd = path.join(DESKTOP, folderName);
    if (!fs.existsSync(cwd)) {
      return NextResponse.json({ error: 'Agent directory not found' }, { status: 404 });
    }

    // Get pending messages
    const messages = db.prepare(`
      SELECT m.*, fa.display_name as from_agent_name
      FROM agent_messages m
      LEFT JOIN agents fa ON fa.id = m.from_agent_id
      WHERE m.to_agent_id = ? AND m.status = 'pending'
      ORDER BY m.created_at ASC
    `).all(id) as Array<{
      id: number;
      from_agent_id: string;
      from_agent_name: string;
      content: string;
      message_type: string;
      created_at: string;
    }>;

    // Get active workflow step info
    const activeStep = db.prepare(`
      SELECT ws.name as step_name, wr.name as workflow_name, ws.step_order
      FROM workflow_steps ws
      JOIN workflow_runs wr ON wr.id = ws.workflow_run_id
      WHERE ws.agent_id = ? AND ws.status = 'in_progress'
      LIMIT 1
    `).get(id) as { step_name: string; workflow_name: string; step_order: number } | undefined;

    // Build INBOX.md content
    let content = `# Inbox for ${agent.display_name}\n\n`;

    if (activeStep) {
      content += `## Active Workflow Task\n`;
      content += `**${activeStep.workflow_name}** > Step ${activeStep.step_order}: ${activeStep.step_name}\n\n`;
    }

    if (messages.length > 0) {
      content += `## Pending Messages\n\n`;
      for (const msg of messages) {
        const typeLabel = msg.message_type === 'handoff' ? '(handoff)' : msg.message_type === 'request' ? '(request)' : '';
        content += `### From ${msg.from_agent_name} ${typeLabel}\n`;
        content += `_${msg.created_at}_\n\n`;
        content += msg.content + '\n\n---\n\n';
      }

      // Mark messages as delivered
      const ids = messages.map(m => m.id);
      db.prepare(`
        UPDATE agent_messages SET status = 'delivered', delivered_at = datetime('now')
        WHERE id IN (${ids.map(() => '?').join(',')})
      `).run(...ids);
    } else {
      content += `_No pending messages._\n`;
    }

    // Write INBOX.md
    fs.writeFileSync(path.join(cwd, 'INBOX.md'), content, 'utf-8');

    return NextResponse.json({ success: true, messageCount: messages.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to refresh inbox', detail: String(error) },
      { status: 500 }
    );
  }
}
