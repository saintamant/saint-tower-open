# Workflows

## Overview

Workflows are multi-step task pipelines that chain agents together. Each step assigns a task to a specific agent, and steps can depend on previous steps to create sequential or parallel execution flows.

Workflows can be:
- **Manual** — triggered on demand from the UI or API
- **Scheduled** — run automatically via cron expressions

---

## Concepts

### Workflow Template

A workflow template defines the steps and their dependencies:

```typescript
{
  id: number;
  name: string;
  description: string;
  officeId: string;          // which office owns this workflow
  cronExpression?: string;   // optional cron schedule
  steps: WorkflowStepTemplate[];
}
```

### Steps & Dependencies

Each step targets a specific agent and includes a task template with variable interpolation:

```typescript
{
  order: number;
  name: string;
  agentId: string;
  taskTemplate: string;      // supports {{variables}}
  dependsOn?: number[];      // step orders that must complete first
  timeoutMinutes?: number;
}
```

**Dependency rules:**
- Steps with no `dependsOn` run immediately (or in parallel with other independent steps)
- Steps with `dependsOn: [1]` wait for step 1 to complete
- Steps with `dependsOn: [1, 2]` wait for both steps 1 and 2 (fan-in)

### Template Variables

Task templates support variable interpolation:

| Variable | Description |
|----------|-------------|
| `{{input}}` | The initial input provided when the workflow is triggered |
| `{{prev_result}}` | Result from the immediately previous step |
| `{{prev_commits}}` | Recent commits from the previous step's agent |
| `{{step_N_result}}` | Result from a specific step by order number (e.g. `{{step_1_result}}`, `{{step_2_result}}`) |

This allows chaining agent outputs — one agent's work feeds into the next agent's context.

---

## Workflow Templates

### Manual Workflows (1-6)

These are triggered on demand from the UI or via the API.

#### 1. Product Launch Pipeline
**Office:** SA Core
**Flow:** Sequential with fan-out

```
SA Main (Product Plan)
    → Content Writer (Marketing Strategy)
        → Agent E1 (Backend Implementation)
        → Agent E2 (Frontend Implementation)    ← parallel
```

#### 2. Cross-Project Report
**Office:** All
**Flow:** Fan-in

```
Agent C1 (Analytics Data)  ─┐
                             ├→ SA Main (Compile Report)
Agent D1 (Metrics Data)   ─┘
```

#### 3. Weekly Planning
**Office:** SA Core
**Flow:** Sequential with fan-out

```
Manager (Weekly Review)
    → Content Writer (Content Planning)     ← parallel
    → Outreach (Lead Prospecting)           ← parallel
```

#### 4. Content Pipeline
**Office:** SA Core
**Flow:** Sequential

```
Content Writer (Write Post) → SA Main (Strategy Review)
```

#### 5. Outreach Batch
**Office:** SA Core
**Flow:** Sequential

```
Outreach (Research Leads) → Proposals (Prepare Template)
```

#### 6. Lead to Proposal
**Office:** SA Core
**Flow:** Sequential chain

```
Outreach (Lead Summary) → Proposals (Generate Proposal) → Manager (Final Review)
```

---

### Cron Workflows (7-15)

These run automatically on a schedule. Each office has its own daily workflow.

#### 7. SA Core Daily Standup
**Schedule:** `0 8 * * 1-5` (weekdays at 8:00 AM)

```
Manager (Daily Standup)
    → SA Main (Improvement)        ← parallel
    → Content Writer (LinkedIn)    ← parallel
    → Outreach (Lead Research)     ← parallel
```

#### 8. Project E Daily Review
**Schedule:** `0 9 * * 1-5` (weekdays at 9:00 AM)

```
Agent E1 (Backend Review)    ─┐
                               ├→ Agent E1 (Integration Notes)
Agent E2 (Frontend Review)   ─┘
```

#### 9. Project C Daily Health
**Schedule:** `0 9 * * 1-5` (weekdays at 9:00 AM)

```
Agent C1 (Agent Review)   ─┐
                            ├→ Agent C1 (Cross-Review)
Agent C2 (Config Review)  ─┘
```

#### 10. Project B Daily Ops
**Schedule:** `0 9 * * 1-5` (weekdays at 9:00 AM)

```
Agent B1 (Operations Review)   ─┐
                                 ├→ Agent B1 (Integration Check)
Agent B2 (Logistics Review)    ─┘
```

#### 11. Project A Daily Check
**Schedule:** `0 9 * * 1-5` (weekdays at 9:00 AM)

```
Agent A1 (SQL Review)   ─┐
                          ├→ Agent A1 (Data Pipeline Optimization)
Agent A2 (ML Review)    ─┘
```

#### 12. Project D Daily Review
**Schedule:** `0 9 * * 1-5` (weekdays at 9:00 AM)

```
Agent D1 (Self-Review) → Agent D1 (Implement & Propose)
```

#### 13. Lab Daily Analysis
**Schedule:** `0 10 * * *` (daily at 10:00 AM)

```
Lab Bot (Self-Review) → Lab Bot (Implement & Analyze)
```

#### 14. Library Progress
**Schedule:** `0 10 * * 1-5` (weekdays at 10:00 AM)

```
Learn Bot (Study Review) → Learn Bot (Study & Plan)
```

#### 15. Daily Commit Vault
**Schedule:** `0 20 * * *` (daily at 8:00 PM)

```
SA Main (Compile daily commit digest across all repos)
```

---

## Workflow Runs

When a workflow is triggered, a **run** is created:

```typescript
{
  id: number;
  workflowId: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  rating?: number;          // 1-5 quality rating after completion
  ratingNotes?: string;
  retroResult?: string;     // post-run retrospective
  steps: WorkflowStepExecution[];
}
```

Each step in the run tracks its own status, result, and commits:

```typescript
{
  stepOrder: number;
  agentId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  commits?: { sha: string; message: string }[];
}
```

---

## API

### Workflow Templates
```
GET  /api/workflows          # List all workflow templates
GET  /api/workflows/:id      # Get a specific template
```

### Workflow Runs
```
POST /api/workflows/:id/run  # Trigger a workflow run
GET  /api/workflow-runs       # List all runs
GET  /api/workflow-runs/:id   # Get run details with steps
```

### Step Updates
```
PATCH /api/workflow-runs/:id/steps/:stepId   # Update step status/result
```

### Stats
```
GET /api/workflow-stats       # Aggregated workflow statistics
```

### Scheduler
```
GET /api/scheduler            # List cron schedules and their status
```

---

## Adding a New Workflow

1. Add a new entry to `src/data/workflows.ts`:

```typescript
{
  id: 16,
  name: 'My New Workflow',
  description: 'Agent A does X → Agent B does Y',
  officeId: 'sa-core',
  cronExpression: '0 12 * * 1-5',  // optional: weekdays at noon
  steps: [
    {
      order: 1,
      name: 'Step One',
      agentId: 'sa-main',
      taskTemplate: 'Do something with: {{input}}',
    },
    {
      order: 2,
      name: 'Step Two',
      agentId: 'content-writer',
      taskTemplate: 'Process the result:\n\n{{prev_result}}',
      dependsOn: [1],
    },
  ],
}
```

2. The workflow will appear in the UI and scheduler automatically.
