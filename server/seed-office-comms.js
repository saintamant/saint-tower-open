/**
 * seed-office-comms.js
 *
 * Appends office team communication sections to each agent's claude_md.
 * Safe to run multiple times — checks for existing section before appending.
 *
 * Usage: node server/seed-office-comms.js
 */
const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_PATH || './db/saint-tower.db';

// --- Office team definitions ---

const OFFICE_TEAMS = {
  'sa-core': {
    name: 'SA Core',
    agents: {
      'juan': { displayName: 'Saint', role: 'Owner. Manages saint-tower, strategic decisions, architecture.' },
      'manager': { displayName: 'Manager', role: 'Weekly Ops & Planning. Manages weekly planning, OKRs, tracking.' },
      'sa-main': { displayName: 'Saint Analytics', role: 'Strategy & Growth. Manages commercial strategy, market analysis, dashboards.' },
      'content-writer': { displayName: 'Content Writer', role: 'Marketing Content. Manages LinkedIn posts, blogs, brand content.' },
      'outreach': { displayName: 'Outreach', role: 'Sales & Lead Gen. Manages prospecting, sales emails, CRM.' },
      'proposals': { displayName: 'Proposals', role: 'Proposal Writer. Manages commercial proposals, presentations, pricing.' },
    },
  },
  'project-a': {
    name: 'Project A',
    agents: {
      'agent-a1': { displayName: 'Agent A1', role: 'SQL Platform. Manages the SQL agent, queries, data integration.' },
      'agent-a2': { displayName: 'Agent A2', role: 'Machine Learning. Manages models, features, training data.' },
    },
  },
  'project-c': {
    name: 'Project C',
    agents: {
      'agent-c1': { displayName: 'Agent C1', role: 'Analytics Agent. Manages the SQL agent, queries, reports.' },
      'agent-c2': { displayName: 'Agent C2', role: 'Config & Dashboard. Manages the analytics configurator, UI, settings.' },
    },
  },
  'project-e': {
    name: 'Project E',
    agents: {
      'agent-e1': { displayName: 'Agent E1', role: 'Backend Dev. Manages API, database, business logic.' },
      'agent-e2': { displayName: 'Agent E2', role: 'Frontend Dev. Manages UI, React components, pages.' },
    },
  },
};

// Agents in single-agent offices (no team section, just inter-office comms)
const SOLO_AGENTS = [
  'agent-b1',
  'agent-b2',
  'lab-bot',
  'agent-d1',
  'learn-bot',
];

// --- When-to-communicate rules per office type ---

const WHEN_RULES = {
  'project-e': [
    'Changed an endpoint, API schema or data model → notify the other so they can adapt',
    'Need a change on the other side (UI or API) → request with context',
    'Found a bug that crosses front/back → notify with details',
    'Deployed something new or merged to main → notify about changes',
    'Finished a task that unblocks the other\'s work → notify them',
  ],
  'project-a': [
    'Found a bug or problem affecting the other → notify them',
    'Need data, a model or a feature from the other → request with context',
    'Finished something that impacts the other (new model, new endpoint, schema change) → notify with branch and details',
    'Have an improvement idea that involves the other → propose it',
  ],
  'project-c': [
    'Changed queries, tables or agent SQL logic → notify the configurator',
    'Changed settings, UI or configurator parameters → notify the SQL agent',
    'Found a bug that crosses agent/config → notify with details',
    'Deployed changes or merged to main → notify',
  ],
  'sa-core': [
    'Finished content that needs review or approval → notify manager or sa-main',
    'Need data or input from another team member → request with context',
    'Found a problem affecting another agent → notify them',
    'Generated a lead or proposal that needs follow-up → notify outreach or proposals',
    'Changed something that impacts strategy or content → notify the affected team',
  ],
};

const MARKER = '## Your team';
const SOLO_MARKER = '## Inter-office communication';

function buildTeamSection(agentId, officeKey) {
  const office = OFFICE_TEAMS[officeKey];
  const teammates = Object.entries(office.agents)
    .filter(([id]) => id !== agentId)
    .map(([id, info]) => `- **${id}** (${info.displayName}) — ${info.role}`)
    .join('\n');

  const rules = (WHEN_RULES[officeKey] || WHEN_RULES['sa-core'])
    .map(r => `- ${r}`)
    .join('\n');

  return `
## Your team (Office ${office.name})

You are part of the ${office.name} team. Your teammates:
${teammates}

### When to communicate with your team
${rules}

### How to send messages
\`\`\`bash
curl -s -X POST http://localhost:3000/api/messages \\
  -H "Content-Type: application/json" \\
  -d '{"fromAgentId":"${agentId}","toAgentId":"AGENT_ID","content":"your message"}'
\`\`\`
Replace AGENT_ID with the teammate's id and write a clear message with context.

### How to receive messages
When you see "You have N new message(s)", read INBOX.md in your directory. Process each message and respond if needed.

### Communication protocol
- Always include context: which branch, which files, what you changed
- If the other doesn't respond, continue with your work — don't block waiting
- Don't send trivial messages — only when the other needs to know
- Respond to messages you receive if they require action or confirmation
`;
}

function buildSoloSection(agentId) {
  return `
## Inter-office communication

If you need to coordinate with agents from another office, you can send messages:
\`\`\`bash
curl -s -X POST http://localhost:3000/api/messages \\
  -H "Content-Type: application/json" \\
  -d '{"fromAgentId":"${agentId}","toAgentId":"AGENT_ID","content":"your message"}'
\`\`\`

When you see "You have N new message(s)", read INBOX.md in your directory.
`;
}

function main() {
  const db = new Database(DB_PATH);

  // Ensure column exists
  const cols = db.prepare('PRAGMA table_info(agents)').all();
  if (!cols.some(c => c.name === 'claude_md')) {
    db.exec('ALTER TABLE agents ADD COLUMN claude_md TEXT');
    console.log('Added claude_md column');
  }

  const update = db.prepare('UPDATE agents SET claude_md = ? WHERE id = ?');
  let updated = 0;

  // Process team agents
  for (const [officeKey, office] of Object.entries(OFFICE_TEAMS)) {
    for (const agentId of Object.keys(office.agents)) {
      const row = db.prepare('SELECT claude_md FROM agents WHERE id = ?').get(agentId);
      if (!row) {
        console.log(`  [SKIP] ${agentId} — not found in DB`);
        continue;
      }

      let existing = row.claude_md || '';

      // Remove old team section if exists (to allow re-running)
      if (existing.includes(MARKER)) {
        existing = existing.substring(0, existing.indexOf(MARKER)).trimEnd();
      }
      if (existing.includes(SOLO_MARKER)) {
        existing = existing.substring(0, existing.indexOf(SOLO_MARKER)).trimEnd();
      }

      const teamSection = buildTeamSection(agentId, officeKey);
      const newContent = existing + '\n' + teamSection;

      update.run(newContent, agentId);
      updated++;
      console.log(`  [OK] ${agentId} (${office.name}) — team section added`);
    }
  }

  // Process solo agents
  for (const agentId of SOLO_AGENTS) {
    const row = db.prepare('SELECT claude_md FROM agents WHERE id = ?').get(agentId);
    if (!row) {
      console.log(`  [SKIP] ${agentId} — not found in DB`);
      continue;
    }

    let existing = row.claude_md || '';

    if (existing.includes(MARKER)) {
      existing = existing.substring(0, existing.indexOf(MARKER)).trimEnd();
    }
    if (existing.includes(SOLO_MARKER)) {
      existing = existing.substring(0, existing.indexOf(SOLO_MARKER)).trimEnd();
    }

    const soloSection = buildSoloSection(agentId);
    const newContent = existing + '\n' + soloSection;

    update.run(newContent, agentId);
    updated++;
    console.log(`  [OK] ${agentId} (solo) — inter-office section added`);
  }

  // Verify
  console.log(`\nUpdated ${updated} agents.`);
  const agents = db.prepare('SELECT id, length(claude_md) as md_len FROM agents ORDER BY id').all();
  console.log('\nAgent CLAUDE.md sizes:');
  agents.forEach(a => console.log(`  ${a.id}: ${a.md_len || 0} chars`));

  db.close();
  console.log('\nDone!');
}

main();
