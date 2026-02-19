import { NextRequest, NextResponse } from 'next/server';
import { seedData } from '@/lib/db';
import { launchAgent } from '@/lib/launcher';

export const runtime = 'nodejs';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    seedData();

    let subdir: string | undefined;
    let task: string | undefined;
    try {
      const body = await _request.json();
      subdir = body?.subdir;
      task = body?.task;
    } catch {
      // No body or invalid JSON — that's fine
    }

    const { cwd, agentName } = launchAgent(id, { task, subdir });

    return NextResponse.json({ success: true, cwd, agentName });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to launch terminal', detail: String(error) },
      { status: 500 }
    );
  }
}
