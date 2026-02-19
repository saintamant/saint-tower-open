import { WorkflowStepTemplate } from '@/types/workflow';

export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  officeId: string;
  cronExpression?: string;
  steps: WorkflowStepTemplate[];
}

export const workflows: WorkflowTemplate[] = [
  {
    id: 1,
    name: 'Product Launch Pipeline',
    description: 'Plan → Marketing → Backend + Frontend (parallel)',
    officeId: 'sa-core',
    steps: [
      {
        order: 1,
        name: 'Product Plan',
        agentId: 'sa-main',
        taskTemplate: 'Create a detailed product plan for: {{input}}',
      },
      {
        order: 2,
        name: 'Marketing Strategy',
        agentId: 'content-writer',
        taskTemplate: 'Create marketing strategy based on this product plan:\n\n{{prev_result}}\n\nRecent commits: {{prev_commits}}',
        dependsOn: [1],
      },
      {
        order: 3,
        name: 'Backend Implementation',
        agentId: 'agent-e1',
        taskTemplate: 'Implement backend for:\n\n{{prev_result}}',
        dependsOn: [2],
      },
      {
        order: 4,
        name: 'Frontend Implementation',
        agentId: 'agent-e2',
        taskTemplate: 'Build frontend UI for:\n\n{{prev_result}}',
        dependsOn: [2],
      },
    ],
  },
  {
    id: 2,
    name: 'Cross-Project Report',
    description: 'Project C data + Project D data → SA compiles report',
    officeId: 'all',
    steps: [
      {
        order: 1,
        name: 'Analytics Data',
        agentId: 'agent-c1',
        taskTemplate: 'Pull analytics data for: {{input}}',
      },
      {
        order: 2,
        name: 'Metrics Data',
        agentId: 'agent-d1',
        taskTemplate: 'Pull performance metrics for: {{input}}',
      },
      {
        order: 3,
        name: 'Compile Report',
        agentId: 'sa-main',
        taskTemplate: 'Compile final report:\n\nProject C: {{step_1_result}}\nProject D: {{step_2_result}}',
        dependsOn: [1, 2],
      },
    ],
  },
  {
    id: 3,
    name: 'Weekly Planning',
    description: 'Manager reviews KPIs → Content + Outreach plan in parallel',
    officeId: 'sa-core',
    steps: [
      {
        order: 1,
        name: 'Weekly Review & Plan',
        agentId: 'manager',
        taskTemplate: 'Review last week KPIs and generate weekly plan for: {{input}}',
      },
      {
        order: 2,
        name: 'Content Planning',
        agentId: 'content-writer',
        taskTemplate: 'Plan 2 LinkedIn posts for this week based on the plan:\n\n{{prev_result}}',
        dependsOn: [1],
      },
      {
        order: 3,
        name: 'Lead Prospecting',
        agentId: 'outreach',
        taskTemplate: 'Identify 5 new leads and prepare outreach messages based on the plan:\n\n{{step_1_result}}',
        dependsOn: [1],
      },
    ],
  },
  {
    id: 4,
    name: 'Content Pipeline',
    description: 'Content Writer drafts → SA Main reviews strategic alignment',
    officeId: 'sa-core',
    steps: [
      {
        order: 1,
        name: 'Write Post',
        agentId: 'content-writer',
        taskTemplate: 'Write a LinkedIn post about: {{input}}',
      },
      {
        order: 2,
        name: 'Strategy Review',
        agentId: 'sa-main',
        taskTemplate: 'Review that the post aligns with the company strategy:\n\n{{prev_result}}',
        dependsOn: [1],
      },
    ],
  },
  {
    id: 5,
    name: 'Outreach Batch',
    description: 'Outreach researches leads → Proposals prepares template',
    officeId: 'sa-core',
    steps: [
      {
        order: 1,
        name: 'Research Leads',
        agentId: 'outreach',
        taskTemplate: 'Research companies in {{input}} and generate a lead list with contact info',
      },
      {
        order: 2,
        name: 'Prepare Template',
        agentId: 'proposals',
        taskTemplate: 'Prepare a proposal template for the identified segment:\n\n{{prev_result}}',
        dependsOn: [1],
      },
    ],
  },
  {
    id: 6,
    name: 'Lead to Proposal',
    description: 'Outreach summarizes lead → Proposals generates → Manager reviews',
    officeId: 'sa-core',
    steps: [
      {
        order: 1,
        name: 'Lead Summary',
        agentId: 'outreach',
        taskTemplate: 'Summarize lead information: {{input}}',
      },
      {
        order: 2,
        name: 'Generate Proposal',
        agentId: 'proposals',
        taskTemplate: 'Generate a personalized proposal based on:\n\n{{prev_result}}',
        dependsOn: [1],
      },
      {
        order: 3,
        name: 'Final Review',
        agentId: 'manager',
        taskTemplate: 'Review proposal and provide final feedback:\n\n{{prev_result}}',
        dependsOn: [2],
      },
    ],
  },

  // === Cron Workflows (IDs 7-15) ===

  {
    id: 7,
    name: 'SA Core Daily Standup',
    description: 'Manager review → SA Main, Content, Outreach in parallel',
    officeId: 'sa-core',
    cronExpression: '0 8 * * 1-5',
    steps: [
      {
        order: 1,
        name: 'Daily Standup',
        agentId: 'manager',
        taskTemplate: "Review yesterday's KPIs, pending tasks, and recent commits across SA repos. Generate daily standup summary and today's priorities.",
      },
      {
        order: 2,
        name: 'SA Improvement',
        agentId: 'sa-main',
        taskTemplate: 'Based on standup:\n\n{{prev_result}}\n\nReview your assigned codebase. Identify 1 improvement to implement today. Execute it.',
        dependsOn: [1],
      },
      {
        order: 3,
        name: 'LinkedIn Draft',
        agentId: 'content-writer',
        taskTemplate: 'Based on standup:\n\n{{step_1_result}}\n\nDraft 1 LinkedIn post about the company for today.',
        dependsOn: [1],
      },
      {
        order: 4,
        name: 'Lead Research',
        agentId: 'outreach',
        taskTemplate: 'Based on standup:\n\n{{step_1_result}}\n\nResearch 3 new potential leads and prepare outreach messages.',
        dependsOn: [1],
      },
    ],
  },
  {
    id: 8,
    name: 'Project E Daily Review',
    description: 'Backend + Frontend review in parallel → Integration notes',
    officeId: 'project-e',
    cronExpression: '0 9 * * 1-5',
    steps: [
      {
        order: 1,
        name: 'Backend Review',
        agentId: 'agent-e1',
        taskTemplate: 'Review recent commits in ProjectE-demo/BackEnd. Run tests if possible. Identify and fix 1 bug or implement 1 small improvement. Commit changes.',
      },
      {
        order: 2,
        name: 'Frontend Review',
        agentId: 'agent-e2',
        taskTemplate: 'Review recent commits in ProjectE-demo/FrontEnd. Identify and fix 1 UI issue or implement 1 small improvement. Commit changes.',
      },
      {
        order: 3,
        name: 'Integration Notes',
        agentId: 'agent-e1',
        taskTemplate: 'Review both backend and frontend changes:\n\nBackend: {{step_1_result}}\nFrontend: {{step_2_result}}\n\nWrite integration notes and flag any cross-cutting concerns.',
        dependsOn: [1, 2],
      },
    ],
  },
  {
    id: 9,
    name: 'Project C Daily Health',
    description: 'Agent + Config review in parallel → Cross-review',
    officeId: 'project-c',
    cronExpression: '0 9 * * 1-5',
    steps: [
      {
        order: 1,
        name: 'Agent Review',
        agentId: 'agent-c1',
        taskTemplate: 'Review Agent-C1 repo. Check for issues, run analysis on code quality. Implement 1 improvement or fix. Commit.',
      },
      {
        order: 2,
        name: 'Config Review',
        agentId: 'agent-c2',
        taskTemplate: 'Review Agent-C2 repo. Check for improvements. Implement 1 fix or enhancement. Commit.',
      },
      {
        order: 3,
        name: 'Cross-Review',
        agentId: 'agent-c1',
        taskTemplate: 'Cross-review both repos:\n\nAgent: {{step_1_result}}\nConfig: {{step_2_result}}\n\nIdentify integration opportunities or shared improvements.',
        dependsOn: [1, 2],
      },
    ],
  },
  {
    id: 10,
    name: 'Project B Daily Ops',
    description: 'Operations + Logistics review in parallel → Integration check',
    officeId: 'project-b',
    cronExpression: '0 9 * * 1-5',
    steps: [
      {
        order: 1,
        name: 'Operations Review',
        agentId: 'agent-b1',
        taskTemplate: 'Review Agent-B1 repo. Identify 1 operational improvement. Implement and commit.',
      },
      {
        order: 2,
        name: 'Logistics Review',
        agentId: 'agent-b2',
        taskTemplate: 'Review Agent-B2 repo. Identify 1 platform improvement. Implement and commit.',
      },
      {
        order: 3,
        name: 'Integration Check',
        agentId: 'agent-b1',
        taskTemplate: 'Review both changes:\n\nOperations: {{step_1_result}}\nLogistics: {{step_2_result}}\n\nCheck for integration issues.',
        dependsOn: [1, 2],
      },
    ],
  },
  {
    id: 11,
    name: 'Project A Daily Check',
    description: 'SQL + ML review in parallel → Data pipeline optimization',
    officeId: 'project-a',
    cronExpression: '0 9 * * 1-5',
    steps: [
      {
        order: 1,
        name: 'SQL Review',
        agentId: 'agent-a1',
        taskTemplate: 'Review Agent-A1 repo. Analyze SQL queries for optimization. Implement 1 improvement. Commit.',
      },
      {
        order: 2,
        name: 'ML Review',
        agentId: 'agent-a2',
        taskTemplate: 'Review Agent-A2 repo. Check model performance, data pipeline. Implement 1 improvement. Commit.',
      },
      {
        order: 3,
        name: 'Data Pipeline Optimization',
        agentId: 'agent-a1',
        taskTemplate: 'Cross-review:\n\nSQL: {{step_1_result}}\nML: {{step_2_result}}\n\nIdentify data pipeline optimization opportunities.',
        dependsOn: [1, 2],
      },
    ],
  },
  {
    id: 12,
    name: 'Project D Daily Review',
    description: 'Self-review → Implement improvement + propose future items',
    officeId: 'project-d',
    cronExpression: '0 9 * * 1-5',
    steps: [
      {
        order: 1,
        name: 'Self-Review',
        agentId: 'agent-d1',
        taskTemplate: 'Self-review Agent-D1 repo. Check recent commits, code quality, and test coverage. Identify 1 improvement.',
      },
      {
        order: 2,
        name: 'Implement & Propose',
        agentId: 'agent-d1',
        taskTemplate: 'Based on self-review:\n\n{{prev_result}}\n\nImplement the improvement identified. Commit with descriptive message. Then propose 2 future improvements as GitHub issues or comments.',
        dependsOn: [1],
      },
    ],
  },
  {
    id: 13,
    name: 'Lab Daily Analysis',
    description: 'Self-review → Implement improvement + market analysis',
    officeId: 'lab',
    cronExpression: '0 10 * * *',
    steps: [
      {
        order: 1,
        name: 'Bot Review',
        agentId: 'lab-bot',
        taskTemplate: 'Self-review your repo. Analyze recent data and performance. Identify 1 strategy or code improvement.',
      },
      {
        order: 2,
        name: 'Implement & Analyze',
        agentId: 'lab-bot',
        taskTemplate: 'Based on analysis:\n\n{{prev_result}}\n\nImplement the improvement. Commit. Write a brief analysis of current market opportunities.',
        dependsOn: [1],
      },
    ],
  },
  {
    id: 14,
    name: 'Library Progress',
    description: 'Self-review → Study/exercise + propose next items',
    officeId: 'library',
    cronExpression: '0 10 * * 1-5',
    steps: [
      {
        order: 1,
        name: 'Study Review',
        agentId: 'learn-bot',
        taskTemplate: 'Self-review your study repo. Check study progress, review notes. Identify next topic to study or exercise to complete.',
      },
      {
        order: 2,
        name: 'Study & Plan',
        agentId: 'learn-bot',
        taskTemplate: 'Based on review:\n\n{{prev_result}}\n\nComplete the identified task. Commit notes or code exercises. Propose next 3 study items.',
        dependsOn: [1],
      },
    ],
  },
  {
    id: 15,
    name: 'Daily Commit Vault',
    description: 'Daily digest of commits across all repos',
    officeId: 'all',
    cronExpression: '0 20 * * *',
    steps: [
      {
        order: 1,
        name: 'Compile Digest',
        agentId: 'sa-main',
        taskTemplate: "Compile today's commit digest across ALL repos. List each repo with commits, authors, and summary. Format as daily report.",
      },
    ],
  },
];
