import { NextResponse } from 'next/server';
import { getDb, seedData } from '@/lib/db';

// GET /api/workflow-stats — workflow analytics
export async function GET() {
  try {
    const db = getDb();
    seedData();

    // Overview stats
    const totalRuns = (db.prepare('SELECT COUNT(*) as c FROM workflow_runs').get() as { c: number }).c;
    const completedRuns = (db.prepare("SELECT COUNT(*) as c FROM workflow_runs WHERE status = 'completed'").get() as { c: number }).c;
    const failedRuns = (db.prepare("SELECT COUNT(*) as c FROM workflow_runs WHERE status = 'failed'").get() as { c: number }).c;
    const activeRuns = (db.prepare("SELECT COUNT(*) as c FROM workflow_runs WHERE status IN ('running', 'paused')").get() as { c: number }).c;

    const avgDuration = db.prepare(`
      SELECT AVG(
        (julianday(completed_at) - julianday(started_at)) * 86400
      ) as avg_sec
      FROM workflow_runs
      WHERE status = 'completed' AND completed_at IS NOT NULL
    `).get() as { avg_sec: number | null };

    const avgRating = db.prepare(`
      SELECT AVG(CAST(rating AS REAL)) as avg_rating
      FROM workflow_runs
      WHERE rating IS NOT NULL
    `).get() as { avg_rating: number | null };

    const successRate = totalRuns > 0
      ? Math.round((completedRuns / (completedRuns + failedRuns || 1)) * 1000) / 10
      : 0;

    // Per-workflow breakdown
    const perWorkflow = db.prepare(`
      SELECT
        w.id,
        w.name,
        COUNT(wr.id) as total_runs,
        SUM(CASE WHEN wr.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN wr.status = 'failed' THEN 1 ELSE 0 END) as failed,
        AVG(CASE
          WHEN wr.status = 'completed' AND wr.completed_at IS NOT NULL
          THEN (julianday(wr.completed_at) - julianday(wr.started_at)) * 86400
          ELSE NULL
        END) as avg_duration_seconds,
        AVG(CASE WHEN wr.rating IS NOT NULL THEN CAST(wr.rating AS REAL) ELSE NULL END) as avg_rating
      FROM workflows w
      LEFT JOIN workflow_runs wr ON wr.workflow_id = w.id
      GROUP BY w.id
      ORDER BY total_runs DESC
    `).all();

    // Agent performance
    const agentPerformance = db.prepare(`
      SELECT
        ws.agent_id,
        COALESCE(a.display_name, ws.agent_id) as display_name,
        COUNT(ws.id) as total_steps,
        SUM(CASE WHEN ws.status = 'completed' THEN 1 ELSE 0 END) as completed_steps,
        AVG(CASE
          WHEN ws.status = 'completed' AND ws.completed_at IS NOT NULL AND ws.started_at IS NOT NULL
          THEN (julianday(ws.completed_at) - julianday(ws.started_at)) * 86400
          ELSE NULL
        END) as avg_step_duration_seconds
      FROM workflow_steps ws
      LEFT JOIN agents a ON a.id = ws.agent_id
      GROUP BY ws.agent_id
      ORDER BY total_steps DESC
    `).all();

    // Timeline (last 30 days)
    const timeline = db.prepare(`
      SELECT
        date(started_at) as day,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM workflow_runs
      WHERE started_at >= date('now', '-30 days')
      GROUP BY date(started_at)
      ORDER BY day
    `).all();

    return NextResponse.json({
      overview: {
        totalRuns,
        completedRuns,
        failedRuns,
        activeRuns,
        successRate,
        avgDurationSeconds: avgDuration.avg_sec,
        avgRating: avgRating.avg_rating ? Math.round(avgRating.avg_rating * 10) / 10 : null,
      },
      perWorkflow,
      agentPerformance,
      timeline,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workflow stats', detail: String(error) },
      { status: 500 }
    );
  }
}
