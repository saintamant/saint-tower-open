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
  status TEXT DEFAULT 'offline',
  current_task TEXT,
  sprite_color TEXT,
  last_activity_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT REFERENCES agents(id),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  result TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
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
