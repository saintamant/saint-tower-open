import { HealthLevel } from '@/types/agent';

interface OfficeData {
  activeAgents: number;
  totalAgents: number;
  pendingTasks: number;
  recentErrors: number;
  lastActivityAt: string | null;
}

export function computeRoomHealth(office: OfficeData): HealthLevel {
  if (office.totalAgents === 0) return 'empty';

  const activeRatio = office.activeAgents / office.totalAgents;
  const hoursSinceActivity = office.lastActivityAt
    ? (Date.now() - new Date(office.lastActivityAt).getTime()) / (1000 * 60 * 60)
    : Infinity;

  // Critical: no agents online or no activity in 4h+
  if (office.activeAgents === 0 && hoursSinceActivity > 4) return 'critical';
  if (hoursSinceActivity > 4) return 'critical';

  // Warning: all idle or no activity in 1h+
  if (activeRatio === 0 && hoursSinceActivity > 1) return 'warning';
  if (hoursSinceActivity > 1) return 'warning';

  // Thriving: good active ratio and recent activity
  if (activeRatio >= 0.5 && hoursSinceActivity < 0.5) return 'thriving';

  return 'normal';
}

export const HEALTH_COLORS: Record<HealthLevel, number> = {
  thriving: 0x56d364,
  normal: 0x58a6ff,
  warning: 0xe3b341,
  critical: 0xf85149,
  empty: 0x484f58,
};

export const HEALTH_CSS_COLORS: Record<HealthLevel, string> = {
  thriving: '#56d364',
  normal: '#58a6ff',
  warning: '#e3b341',
  critical: '#f85149',
  empty: '#484f58',
};
