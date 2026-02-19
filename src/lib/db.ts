import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { offices as officeData } from '@/data/offices';
import { agents as agentData } from '@/data/agents';
import { workflows as workflowData } from '@/data/workflows';

const DB_PATH = process.env.DATABASE_PATH || './db/saint-tower.db';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb(db);
    migrateDb(db);
  }
  return db;
}

function migrateDb(db: Database.Database) {
  // Agent table migrations
  const agentCols = db.prepare("PRAGMA table_info(agents)").all() as { name: string }[];
  if (!agentCols.some(c => c.name === 'claude_md')) {
    db.exec('ALTER TABLE agents ADD COLUMN claude_md TEXT');
  }
  if (!agentCols.some(c => c.name === 'position_x')) {
    db.exec('ALTER TABLE agents ADD COLUMN position_x REAL');
  }
  if (!agentCols.some(c => c.name === 'position_y')) {
    db.exec('ALTER TABLE agents ADD COLUMN position_y REAL');
  }

  // Task table migrations — workflow integration
  const taskCols = db.prepare("PRAGMA table_info(tasks)").all() as { name: string }[];
  if (!taskCols.some(c => c.name === 'workflow_step_id')) {
    db.exec('ALTER TABLE tasks ADD COLUMN workflow_step_id INTEGER');
  }
  if (!taskCols.some(c => c.name === 'source_agent_id')) {
    db.exec('ALTER TABLE tasks ADD COLUMN source_agent_id TEXT');
  }

  // Workflow table migrations — cron scheduling + office
  const workflowCols = db.prepare("PRAGMA table_info(workflows)").all() as { name: string }[];
  if (!workflowCols.some(c => c.name === 'cron_expression')) {
    db.exec('ALTER TABLE workflows ADD COLUMN cron_expression TEXT');
  }
  if (!workflowCols.some(c => c.name === 'schedule_enabled')) {
    db.exec('ALTER TABLE workflows ADD COLUMN schedule_enabled INTEGER DEFAULT 1');
  }
  if (!workflowCols.some(c => c.name === 'office_id')) {
    db.exec("ALTER TABLE workflows ADD COLUMN office_id TEXT DEFAULT 'sa-core'");
  }

  // Indexes on migrated columns (must be after ALTER TABLE)
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_workflow_step ON tasks(workflow_step_id)');

  // Daily digests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_digests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      workflow_run_id INTEGER REFERENCES workflow_runs(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS offices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id TEXT,
      color TEXT,
      github_org TEXT,
      telegram_group_id TEXT
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_name TEXT,
      role TEXT NOT NULL,
      office_id TEXT REFERENCES offices(id),
      openclaw_session_id TEXT,
      telegram_user_id TEXT,
      github_repo TEXT,
      claude_md TEXT,
      status TEXT DEFAULT 'offline',
      current_task TEXT,
      sprite_color TEXT,
      last_activity_at TIMESTAMP,
      position_x REAL,
      position_y REAL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT REFERENCES agents(id),
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      result TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      workflow_step_id INTEGER,
      source_agent_id TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT REFERENCES agents(id),
      type TEXT NOT NULL,
      content TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS repo_cache (
      repo_full_name TEXT NOT NULL,
      data_type TEXT NOT NULL,
      path TEXT NOT NULL DEFAULT '',
      data_json TEXT NOT NULL,
      cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (repo_full_name, data_type, path)
    );

    -- Inter-agent messaging
    CREATE TABLE IF NOT EXISTS agent_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_agent_id TEXT NOT NULL REFERENCES agents(id),
      to_agent_id TEXT NOT NULL REFERENCES agents(id),
      content TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'message',
      workflow_run_id INTEGER REFERENCES workflow_runs(id),
      status TEXT NOT NULL DEFAULT 'pending',
      in_reply_to INTEGER REFERENCES agent_messages(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      delivered_at TIMESTAMP
    );

    -- Workflow templates
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      steps_json TEXT NOT NULL,
      cron_expression TEXT,
      schedule_enabled INTEGER DEFAULT 1,
      office_id TEXT DEFAULT 'sa-core',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Workflow run instances
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL REFERENCES workflows(id),
      name TEXT NOT NULL,
      input TEXT,
      status TEXT NOT NULL DEFAULT 'running',
      rating INTEGER,
      rating_notes TEXT,
      retro_result TEXT,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      started_by TEXT DEFAULT 'juan'
    );

    -- Individual steps within a workflow run
    CREATE TABLE IF NOT EXISTS workflow_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_run_id INTEGER NOT NULL REFERENCES workflow_runs(id),
      step_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      task_id INTEGER REFERENCES tasks(id),
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT,
      commits_json TEXT,
      started_at TIMESTAMP,
      completed_at TIMESTAMP
    );

    -- Indexes (only non-migration columns here)
    CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_agent_id ON activity_logs(agent_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_agents_office_id ON agents(office_id);
    CREATE INDEX IF NOT EXISTS idx_repo_cache_cached_at ON repo_cache(cached_at);
    CREATE INDEX IF NOT EXISTS idx_agent_messages_to ON agent_messages(to_agent_id, status);
    CREATE INDEX IF NOT EXISTS idx_agent_messages_workflow ON agent_messages(workflow_run_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_steps_run ON workflow_steps(workflow_run_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
  `);
}

// Seed offices, agents, and workflows from static data
export function seedData() {
  const db = getDb();

  // Always upsert offices
  const insertOffice = db.prepare(
    'INSERT OR IGNORE INTO offices (id, name, type, parent_id, color, github_org) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const o of officeData) {
    insertOffice.run(o.id, o.name, o.type, o.parentId || null, o.color, o.githubOrg || null);
  }

  // Always upsert agents (INSERT OR IGNORE ensures new agents get added without touching existing ones)
  const insertAgent = db.prepare(
    'INSERT OR IGNORE INTO agents (id, name, display_name, role, office_id, status, sprite_color, github_repo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const a of agentData) {
    insertAgent.run(a.id, a.name, a.displayName, a.role, a.officeId, a.status, a.spriteColor, a.githubRepo || null);
  }

  // Seed workflow templates (INSERT OR IGNORE + UPDATE to keep cron/office in sync)
  const insertWorkflow = db.prepare(
    'INSERT OR IGNORE INTO workflows (id, name, description, steps_json, cron_expression, office_id) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const updateWorkflowMeta = db.prepare(
    'UPDATE workflows SET cron_expression = ?, office_id = ? WHERE id = ? AND (cron_expression IS NOT ? OR office_id IS NOT ?)'
  );
  for (const w of workflowData) {
    insertWorkflow.run(w.id, w.name, w.description, JSON.stringify(w.steps), w.cronExpression || null, w.officeId || 'sa-core');
    updateWorkflowMeta.run(w.cronExpression || null, w.officeId || 'sa-core', w.id, w.cronExpression || null, w.officeId || 'sa-core');
  }
}

// Cleanup old data — call periodically (e.g. hourly)
export function cleanupOldData() {
  const db = getDb();
  db.prepare("DELETE FROM activity_logs WHERE timestamp < datetime('now', '-7 days')").run();
  db.prepare("DELETE FROM repo_cache WHERE cached_at < datetime('now', '-1 day')").run();
}
