import { execSync } from 'child_process';
import { getDb } from './db';
import { RepoCommit, RepoPullRequest, RepoIssue, RepoFile, RepoInfo } from '@/types/agent';

const CACHE_TTL_MS = 5 * 60 * 1000;       // 5 minutes default
const COMMITS_TTL_MS = 2 * 60 * 1000;     // 2 minutes for commits

// ── Core: call gh api (already authenticated) ──

function ghApi(endpoint: string): unknown {
  // No leading / — Windows Git Bash rewrites /repos to C:/Program Files/Git/repos
  const cmd = `gh api ${endpoint}`;
  const result = execSync(cmd, { encoding: 'utf-8', timeout: 15000 });
  return JSON.parse(result);
}

// ── Cache helpers ──

function getCached(repo: string, dataType: string, path = ''): unknown | null {
  const db = getDb();
  const ttl = dataType === 'commits' ? COMMITS_TTL_MS : CACHE_TTL_MS;
  const row = db.prepare(
    `SELECT data_json, cached_at FROM repo_cache
     WHERE repo_full_name = ? AND data_type = ? AND path = ?`
  ).get(repo, dataType, path) as { data_json: string; cached_at: string } | undefined;

  if (!row) return null;

  const age = Date.now() - new Date(row.cached_at).getTime();
  if (age > ttl) return null;

  return JSON.parse(row.data_json);
}

function setCache(repo: string, dataType: string, data: unknown, path = '') {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO repo_cache (repo_full_name, data_type, path, data_json, cached_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(repo, dataType, path, JSON.stringify(data));
}

export function invalidateCache(repo: string) {
  const db = getDb();
  db.prepare('DELETE FROM repo_cache WHERE repo_full_name = ?').run(repo);
}

// ── API functions ──

export function getRecentCommits(repo: string, count = 10): RepoCommit[] {
  const cached = getCached(repo, 'commits') as RepoCommit[] | null;
  if (cached) return cached.slice(0, count);

  try {
    const data = ghApi(`repos/${repo}/commits?per_page=${count}`) as Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
    }>;

    const commits: RepoCommit[] = data.map(c => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
    }));

    setCache(repo, 'commits', commits);
    return commits;
  } catch {
    return [];
  }
}

export function getOpenPRs(repo: string): RepoPullRequest[] {
  const cached = getCached(repo, 'prs') as RepoPullRequest[] | null;
  if (cached) return cached;

  try {
    const data = ghApi(`repos/${repo}/pulls?state=open&per_page=30`) as Array<{
      number: number;
      title: string;
      state: string;
      user: { login: string };
      created_at: string;
      html_url: string;
    }>;

    const prs: RepoPullRequest[] = data.map(p => ({
      number: p.number,
      title: p.title,
      state: p.state,
      author: p.user.login,
      createdAt: p.created_at,
      url: p.html_url,
    }));

    setCache(repo, 'prs', prs);
    return prs;
  } catch {
    return [];
  }
}

export function getOpenIssues(repo: string): RepoIssue[] {
  const cached = getCached(repo, 'issues') as RepoIssue[] | null;
  if (cached) return cached;

  try {
    const data = ghApi(`repos/${repo}/issues?state=open&per_page=30`) as Array<{
      number: number;
      title: string;
      state: string;
      labels: Array<{ name: string }>;
      user: { login: string };
      html_url: string;
      pull_request?: unknown;
    }>;

    // Exclude pull requests (GitHub includes them in issues endpoint)
    const issues: RepoIssue[] = data
      .filter(i => !i.pull_request)
      .map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        labels: i.labels.map(l => l.name),
        author: i.user.login,
        url: i.html_url,
      }));

    setCache(repo, 'issues', issues);
    return issues;
  } catch {
    return [];
  }
}

export function getRepoTree(repo: string, dirPath = ''): RepoFile[] {
  const cacheKey = dirPath || '_root';
  const cached = getCached(repo, 'tree', cacheKey) as RepoFile[] | null;
  if (cached) return cached;

  try {
    const endpoint = dirPath
      ? `repos/${repo}/contents/${dirPath}`
      : `repos/${repo}/contents`;

    const data = ghApi(endpoint) as Array<{
      name: string;
      path: string;
      type: string;
      size: number;
    }>;

    const files: RepoFile[] = data.map(f => ({
      name: f.name,
      path: f.path,
      type: f.type === 'dir' ? 'dir' : 'file',
      size: f.size || 0,
    }));

    // Sort: dirs first, then files
    files.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    setCache(repo, 'tree', files, cacheKey);
    return files;
  } catch {
    return [];
  }
}

export function getFileContent(repo: string, filePath: string): string {
  const cached = getCached(repo, 'file', filePath) as string | null;
  if (cached) return cached;

  try {
    const data = ghApi(`repos/${repo}/contents/${filePath}`) as {
      content: string;
      encoding: string;
    };

    const content = data.encoding === 'base64'
      ? Buffer.from(data.content, 'base64').toString('utf-8')
      : data.content;

    setCache(repo, 'file', content, filePath);
    return content;
  } catch {
    return '';
  }
}

// ── Commit tracking for activity feed ──

export function checkForNewCommits(agentId: string, repo: string): void {
  const db = getDb();
  const commits = getRecentCommits(repo, 10);
  if (commits.length === 0) return;

  const latestSha = commits[0].sha;

  // Get last seen SHA
  const row = db.prepare(
    `SELECT data_json FROM repo_cache WHERE repo_full_name = ? AND data_type = ? AND path = ?`
  ).get(repo, 'last_seen_sha', '') as { data_json: string } | undefined;

  const lastSeenSha = row ? JSON.parse(row.data_json) : null;

  if (lastSeenSha === latestSha) return;

  // Find new commits (everything before the last seen SHA)
  const newCommits: RepoCommit[] = [];
  for (const commit of commits) {
    if (commit.sha === lastSeenSha) break;
    newCommits.push(commit);
  }

  // First time: just seed the SHA without logging (avoid spam on first run)
  // Otherwise: log up to 5 new commits
  if (lastSeenSha !== null) {
    const toLog = newCommits.slice(0, 5);
    for (const commit of toLog) {
      db.prepare('INSERT INTO activity_logs (agent_id, type, content) VALUES (?, ?, ?)')
        .run(agentId, 'commit', `${commit.sha} — ${commit.message}`);
    }
  }

  // Update last seen SHA
  setCache(repo, 'last_seen_sha', latestSha);
}

export function getRepoInfo(repo: string): RepoInfo {
  const cached = getCached(repo, 'info') as RepoInfo | null;
  if (cached) return cached;

  try {
    const repoData = ghApi(`repos/${repo}`) as {
      full_name: string;
      default_branch: string;
      language: string | null;
    };

    const info: RepoInfo = {
      fullName: repoData.full_name,
      defaultBranch: repoData.default_branch,
      language: repoData.language || 'Unknown',
      recentCommits: getRecentCommits(repo, 5),
      openPRs: getOpenPRs(repo),
      openIssues: getOpenIssues(repo),
    };

    setCache(repo, 'info', info);
    return info;
  } catch {
    return {
      fullName: repo,
      defaultBranch: 'main',
      language: 'Unknown',
      recentCommits: [],
      openPRs: [],
      openIssues: [],
    };
  }
}
