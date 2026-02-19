const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_PATH || './db/saint-tower.db';

async function main() {
  const db = new Database(DB_PATH);

  // Ensure column exists
  const cols = db.prepare('PRAGMA table_info(agents)').all();
  if (!cols.some(c => c.name === 'claude_md')) {
    db.exec('ALTER TABLE agents ADD COLUMN claude_md TEXT');
    console.log('Added claude_md column');
  }

  // Example: seed CLAUDE.md content for agents
  // Add your own agent CLAUDE.md content here
  const claudeMdContent = {
    // 'agent-c1': 'Your CLAUDE.md content here...',
    // 'agent-d1': 'Your CLAUDE.md content here...',
  };

  for (const [agentId, content] of Object.entries(claudeMdContent)) {
    db.prepare('UPDATE agents SET claude_md = ? WHERE id = ?').run(content, agentId);
    console.log(`  -> Seeded ${agentId} (${content.length} chars)`);
  }

  // Verify
  const agents = db.prepare('SELECT id, github_repo, length(claude_md) as md_len FROM agents').all();
  console.log('\nAgent CLAUDE.md status:');
  agents.forEach(a => console.log(`  ${a.id}: repo=${a.github_repo || 'none'}, claude_md=${a.md_len || 0} chars`));

  db.close();
  console.log('\nDone!');
}

main().catch(console.error);
