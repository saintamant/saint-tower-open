export interface WorkflowStepTemplate {
  order: number;
  name: string;
  agentId: string;
  taskTemplate: string; // {{input}}, {{prev_result}}, {{prev_commits}}, {{step_N_result}}
  dependsOn?: number[];
  timeoutMinutes?: number;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  officeId?: string;
  cronExpression?: string;
  scheduleEnabled?: boolean;
  steps: WorkflowStepTemplate[];
}

export interface WorkflowRun {
  id: number;
  workflowId: number;
  name: string;
  input?: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  rating?: number;
  ratingNotes?: string;
  retroResult?: string;
  steps: WorkflowStepExecution[];
  startedAt: string;
  completedAt?: string;
  startedBy?: string;
}

export interface WorkflowStepExecution {
  id: number;
  stepOrder: number;
  name: string;
  agentId: string;
  agentDisplayName?: string;
  taskId?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  commits?: { sha: string; message: string }[];
  startedAt?: string;
  completedAt?: string;
}

export interface AgentMessage {
  id: number;
  fromAgentId: string;
  toAgentId: string;
  fromAgentName?: string;
  toAgentName?: string;
  content: string;
  messageType: 'message' | 'request' | 'handoff';
  workflowRunId?: number;
  status: 'pending' | 'delivered' | 'read';
  inReplyTo?: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface WorkflowRunSummary {
  id: number;
  name: string;
  status: string;
  totalSteps: number;
  completedSteps: number;
  currentStepName?: string;
  currentAgentId?: string;
  startedAt: string;
}

export interface BuilderNode {
  id: string;
  order: number;
  name: string;
  agentId: string;
  taskTemplate: string;
  timeoutMinutes?: number;
  x: number;
  y: number;
  dependsOn: string[];
}

export interface WorkflowStats {
  overview: {
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    activeRuns: number;
    successRate: number;
    avgDurationSeconds: number | null;
    avgRating: number | null;
  };
  perWorkflow: Array<{
    id: number;
    name: string;
    total_runs: number;
    completed: number;
    failed: number;
    avg_duration_seconds: number | null;
    avg_rating: number | null;
  }>;
  agentPerformance: Array<{
    agent_id: string;
    display_name: string;
    total_steps: number;
    completed_steps: number;
    avg_step_duration_seconds: number | null;
  }>;
  timeline: Array<{
    day: string;
    total: number;
    completed: number;
    failed: number;
  }>;
}
