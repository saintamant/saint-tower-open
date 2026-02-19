import { NextRequest, NextResponse } from 'next/server';
import { scheduler } from '@/lib/scheduler';

// GET /api/scheduler — list all schedules with status
export async function GET() {
  try {
    scheduler.init();
    const schedules = scheduler.getStatus();
    return NextResponse.json({ schedules });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get schedules', detail: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/scheduler — control schedules
export async function POST(request: NextRequest) {
  try {
    scheduler.init();
    const body = await request.json();
    const { workflowId, action } = body as { workflowId: number; action: 'enable' | 'disable' | 'trigger' };

    if (!workflowId || !action) {
      return NextResponse.json({ error: 'workflowId and action required' }, { status: 400 });
    }

    let success = false;
    switch (action) {
      case 'enable':
        success = scheduler.enableSchedule(workflowId);
        break;
      case 'disable':
        success = scheduler.disableSchedule(workflowId);
        break;
      case 'trigger':
        success = scheduler.trigger(workflowId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action. Use enable, disable, or trigger' }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: 'Schedule not found for workflow' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, action, workflowId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update schedule', detail: String(error) },
      { status: 500 }
    );
  }
}
