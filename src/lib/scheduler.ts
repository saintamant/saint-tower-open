import cron, { ScheduledTask } from 'node-cron';
import { getDb } from './db';
import { startWorkflowRun } from './workflowRunner';

export interface ScheduleInfo {
  workflowId: number;
  workflowName: string;
  cronExpression: string;
  enabled: boolean;
  lastTriggered: string | null;
  nextRun: string | null;
}

interface ScheduleEntry {
  workflowId: number;
  workflowName: string;
  cronExpression: string;
  enabled: boolean;
  job: ScheduledTask | null;
  lastTriggered: string | null;
}

class Scheduler {
  private schedules: Map<number, ScheduleEntry> = new Map();
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.loadSchedules();
  }

  private loadSchedules() {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT id, name, cron_expression, schedule_enabled
        FROM workflows
        WHERE cron_expression IS NOT NULL
      `).all() as Array<{
        id: number;
        name: string;
        cron_expression: string;
        schedule_enabled: number | null;
      }>;

      for (const row of rows) {
        const enabled = row.schedule_enabled !== 0;
        const entry: ScheduleEntry = {
          workflowId: row.id,
          workflowName: row.name,
          cronExpression: row.cron_expression,
          enabled,
          job: null,
          lastTriggered: null,
        };

        if (enabled) {
          entry.job = this.createJob(row.id, row.cron_expression);
        }

        this.schedules.set(row.id, entry);
      }

      console.log(`[Scheduler] Loaded ${this.schedules.size} schedules (${rows.filter(r => r.schedule_enabled !== 0).length} enabled)`);
    } catch (error) {
      console.error('[Scheduler] Failed to load schedules:', error);
    }
  }

  private createJob(workflowId: number, cronExpr: string): ScheduledTask {
    return cron.schedule(cronExpr, () => {
      this.triggerWorkflow(workflowId);
    });
  }

  private triggerWorkflow(workflowId: number) {
    try {
      const { runId, workflowName } = startWorkflowRun(workflowId, undefined, 'cron');
      console.log(`[Scheduler] Triggered workflow "${workflowName}" (id=${workflowId}) → run ${runId}`);

      const entry = this.schedules.get(workflowId);
      if (entry) {
        entry.lastTriggered = new Date().toISOString();
      }

      // Telegram notification (fire-and-forget)
      import('./clawdbot').then(({ clawdbot }) => {
        clawdbot.sendMessage('juan', `⏰ [Cron] Workflow "${workflowName}" triggered automatically`);
      }).catch(() => {});
    } catch (error) {
      console.error(`[Scheduler] Failed to trigger workflow ${workflowId}:`, error);
    }
  }

  enableSchedule(workflowId: number) {
    const entry = this.schedules.get(workflowId);
    if (!entry) return false;

    if (entry.job) {
      entry.job.stop();
    }
    entry.job = this.createJob(workflowId, entry.cronExpression);
    entry.enabled = true;

    const db = getDb();
    db.prepare('UPDATE workflows SET schedule_enabled = 1 WHERE id = ?').run(workflowId);
    return true;
  }

  disableSchedule(workflowId: number) {
    const entry = this.schedules.get(workflowId);
    if (!entry) return false;

    if (entry.job) {
      entry.job.stop();
      entry.job = null;
    }
    entry.enabled = false;

    const db = getDb();
    db.prepare('UPDATE workflows SET schedule_enabled = 0 WHERE id = ?').run(workflowId);
    return true;
  }

  trigger(workflowId: number) {
    const entry = this.schedules.get(workflowId);
    if (!entry) return false;
    this.triggerWorkflow(workflowId);
    return true;
  }

  getStatus(): ScheduleInfo[] {
    const result: ScheduleInfo[] = [];
    for (const [, entry] of this.schedules) {
      result.push({
        workflowId: entry.workflowId,
        workflowName: entry.workflowName,
        cronExpression: entry.cronExpression,
        enabled: entry.enabled,
        lastTriggered: entry.lastTriggered,
        nextRun: entry.enabled ? getNextRun(entry.cronExpression) : null,
      });
    }
    return result;
  }
}

function getNextRun(cronExpr: string): string | null {
  try {
    // Parse cron to estimate next run (simple heuristic)
    const now = new Date();
    const parts = cronExpr.split(' ');
    if (parts.length < 5) return null;

    const minute = parseInt(parts[0]);
    const hour = parseInt(parts[1]);

    if (isNaN(minute) || isNaN(hour)) return null;

    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);

    // If already past today, move to tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    // Skip weekends if cron has day-of-week restriction (1-5)
    const dow = parts[4];
    if (dow === '1-5') {
      while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + 1);
      }
    }

    return next.toISOString();
  } catch {
    return null;
  }
}

export const scheduler = new Scheduler();
