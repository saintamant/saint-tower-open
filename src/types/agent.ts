export type AgentStatus = 'active' | 'idle' | 'offline';

export type HealthLevel = 'thriving' | 'normal' | 'warning' | 'critical' | 'empty';

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  role: string;
  officeId: string;
  openclawSessionId?: string;
  telegramUserId?: string;
  githubRepo?: string;
  status: AgentStatus;
  currentTask?: string;
  spriteColor: string;
  lastActivityAt?: string;
  pendingTaskCount?: number;
  errorCount?: number;
  positionX?: number;
  positionY?: number;
}

export interface Task {
  id: number;
  agentId: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  createdAt: string;
  completedAt?: string;
  workflowStepId?: number;
  sourceAgentId?: string;
}

export interface ActivityLog {
  id: number;
  agentId: string;
  agentDisplayName?: string;
  officeId?: string;
  type: 'task' | 'message' | 'cron' | 'error' | 'session' | 'commit';
  content: string;
  timestamp: string;
}

export interface OfficeHealth {
  officeId: string;
  activeAgents: number;
  totalAgents: number;
  pendingTasks: number;
  recentErrors: number;
  lastActivityAt: string | null;
  healthLevel: HealthLevel;
}

export interface RepoCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface RepoPullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  createdAt: string;
  url: string;
}

export interface RepoIssue {
  number: number;
  title: string;
  state: string;
  labels: string[];
  author: string;
  url: string;
}

export interface RepoFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
}

export interface RepoInfo {
  fullName: string;
  defaultBranch: string;
  language: string;
  recentCommits: RepoCommit[];
  openPRs: RepoPullRequest[];
  openIssues: RepoIssue[];
}
