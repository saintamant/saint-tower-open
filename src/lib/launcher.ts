import { getDb } from '@/lib/db';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const DESKTOP = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop');

const REPO_TO_FOLDER: Record<string, string> = {
  'demo-org/saint-tower': '../saint-tower',
  'demo-org/market-bot': '../market-bot',
  'demo-org/analytics': 'demo-analytics',
  'demo-org/marketing': 'demo-marketing',
  'demo-org/sales': 'demo-sales',
  'demo-org/proposals': 'demo-proposals',
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

export function launchAgent(agentId: string, options?: { task?: string; subdir?: string }) {
  const db = getDb();

  const agent = db.prepare('SELECT display_name, github_repo, claude_md, current_task FROM agents WHERE id = ?').get(agentId) as {
    display_name?: string;
    github_repo?: string;
    claude_md?: string;
    current_task?: string;
  } | undefined;

  const agentName = agent?.display_name || agentId;

  // Resolve working directory
  let cwd = process.env.USERPROFILE || process.env.HOME || '';
  if (agent?.github_repo && REPO_TO_FOLDER[agent.github_repo]) {
    cwd = path.join(DESKTOP, REPO_TO_FOLDER[agent.github_repo]);
  }
  if (options?.subdir) {
    cwd = path.join(cwd, options.subdir);
  }

  // Write CLAUDE.md if content exists
  if (agent?.claude_md && fs.existsSync(cwd)) {
    try {
      fs.writeFileSync(path.join(cwd, 'CLAUDE.md'), agent.claude_md, 'utf-8');
    } catch { /* Non-critical */ }
  }

  // Determine task (priority: explicit > current_task > DB pending)
  const task = options?.task
    || agent?.current_task
    || (db.prepare(
        `SELECT description FROM tasks WHERE agent_id = ? AND status IN ('pending', 'in_progress') ORDER BY created_at DESC LIMIT 1`
      ).get(agentId) as { description: string } | undefined)?.description;

  // Write launch script
  const cwdUnix = cwd.replace(/\\/g, '/');
  const tmpDir = path.join(process.env.TEMP || 'C:\\Temp', 'saint-tower');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const scriptPath = path.join(tmpDir, `launch-${agentId}.sh`);
  const safeName = agentName.replace(/'/g, "'\\''");

  // Build claude command
  let claudeCmd = 'claude';
  const resultFileUnix = path.join(tmpDir, `result-${agentId}.txt`).replace(/\\/g, '/');
  if (task) {
    const taskFilePath = path.join(tmpDir, `task-${agentId}.txt`);
    fs.writeFileSync(taskFilePath, task, 'utf-8');
    const taskFileUnix = taskFilePath.replace(/\\/g, '/');
    claudeCmd = `claude -p "$(cat '${taskFileUnix}')" --allowedTools "Bash(git commit:*),Bash(git push:*),Bash(git add:*),Bash(npm:*),Bash(npx:*),Bash(node:*),Bash(python:*),Read,Write,Edit,Glob,Grep" > '${resultFileUnix}' 2>&1`;
  }

  const scriptContent = [
    '#!/bin/bash',
    'source ~/.bash_profile 2>/dev/null',
    'source ~/.bashrc 2>/dev/null',
    'unset CLAUDECODE CLAUDE_CODE_ENTRYPOINT 2>/dev/null',
    `cd "${cwdUnix}"`,
    `export PROMPT_COMMAND='echo -ne "\\033]0;${safeName}\\007"'`,
    `echo -ne "\\033]0;${safeName}\\007"`,
    `echo "=== ${safeName} ==="`,
    task ? `echo "Task: ${task.replace(/"/g, '\\"').replace(/\n/g, ' ').slice(0, 100)}..."` : '',
    'echo "Starting Claude..."',
    'echo ""',
    claudeCmd,
    // Show result in terminal
    `cat '${resultFileUnix}' 2>/dev/null`,
    // Send result back to saint-tower API
    task ? `RESULT=$(cat '${resultFileUnix}' 2>/dev/null | head -c 4000)` : '',
    task ? `curl -s -X POST http://localhost:3000/api/agents/${agentId}/complete -H "Content-Type: application/json" -d "$(jq -n --arg r "$RESULT" '{result: $r}')" > /dev/null 2>&1` : '',
    'echo ""',
    'echo "Claude exited. Press enter to close."',
    'read',
  ].filter(Boolean).join('\n');
  fs.writeFileSync(scriptPath, scriptContent, 'utf-8');
  const scriptUnix = scriptPath.replace(/\\/g, '/');

  const bashPath = 'C:\\Program Files\\Git\\bin\\bash.exe';

  const child = spawn('wt.exe', ['--title', agentName, '--suppressApplicationTitle', '-d', cwd, '--', bashPath, '--login', scriptUnix], {
    detached: true,
    stdio: 'ignore',
  });

  child.on('error', () => {
    const fallback = spawn('cmd.exe', ['/c', 'start', '"Claude"', bashPath, '--login', scriptUnix], {
      detached: true,
      stdio: 'ignore',
      cwd,
    });
    fallback.unref();
  });

  child.unref();

  // Mark agent as active + log
  db.prepare('UPDATE agents SET status = ? WHERE id = ?').run('active', agentId);
  db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
    .run(agentId, 'session', 'Session started');

  return { cwd, agentName };
}
