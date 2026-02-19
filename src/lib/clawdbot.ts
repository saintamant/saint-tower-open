import { sshExec } from './ssh';

export interface ClawdbotAgent {
  name: string;
  status: string;
  workspace: string;
  sessionId?: string;
}

export interface ClawdbotMessage {
  id: string;
  from: string;
  text: string;
  timestamp: string;
}

export interface ClawdbotLogEntry {
  timestamp: string;
  level: string;
  message: string;
  agent?: string;
}

class ClawdbotClient {
  // Agents
  async listAgents(): Promise<ClawdbotAgent[]> {
    try {
      const result = await sshExec('clawdbot agents list --json 2>/dev/null || echo "[]"');
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  async sendToAgent(sessionId: string, message: string): Promise<string> {
    const escaped = message.replace(/"/g, '\\"').replace(/\$/g, '\\$');
    try {
      const result = await sshExec(
        `clawdbot agent -m "${escaped}" --session-id ${sessionId} --json 2>/dev/null`
      );
      return result;
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }

  // Telegram messages
  async readMessages(target: string, limit: number = 20): Promise<ClawdbotMessage[]> {
    try {
      const result = await sshExec(
        `clawdbot message read --channel telegram -t ${target} --limit ${limit} --json 2>/dev/null || echo "[]"`
      );
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  async sendMessage(target: string, text: string): Promise<void> {
    // Resolve telegram target via environment or pass through
    const TELEGRAM_TARGETS: Record<string, string> = {};
    const telegramAdminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (telegramAdminId) {
      TELEGRAM_TARGETS['admin'] = telegramAdminId;
    }
    const resolvedTarget = TELEGRAM_TARGETS[target] || target;
    const escaped = text.replace(/"/g, '\\"').replace(/\$/g, '\\$');
    await sshExec(
      `clawdbot message send --channel telegram -t ${resolvedTarget} -m "${escaped}" 2>/dev/null`
    );
  }

  // Logs
  async getLogs(limit: number = 50): Promise<ClawdbotLogEntry[]> {
    try {
      const result = await sshExec(
        `clawdbot logs --json --limit ${limit} 2>/dev/null || echo "[]"`
      );
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  // System presence
  async getPresence(): Promise<Record<string, string>> {
    try {
      const result = await sshExec('clawdbot system presence --json 2>/dev/null || echo "{}"');
      return JSON.parse(result);
    } catch {
      return {};
    }
  }

  // Add new agent
  async addAgent(name: string, workspace: string): Promise<void> {
    await sshExec(
      `clawdbot agents add ${name} --workspace ${workspace} --non-interactive 2>/dev/null`
    );
  }
}

export const clawdbot = new ClawdbotClient();
