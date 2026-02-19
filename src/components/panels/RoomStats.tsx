'use client';

import { OfficeHealth, HealthLevel } from '@/types/agent';
import { HEALTH_CSS_COLORS } from '@/lib/health';

const healthLabels: Record<HealthLevel, string> = {
  thriving: 'Thriving',
  normal: 'Normal',
  warning: 'Attention',
  critical: 'Stalled',
  empty: 'Empty',
};

const healthIcons: Record<HealthLevel, string> = {
  thriving: '●',
  normal: '●',
  warning: '▲',
  critical: '✖',
  empty: '○',
};

const roomNames: Record<string, string> = {
  'sa-core': 'SA Core',
  'project-a': 'Project A',
  'project-b': 'Project B',
  'project-c': 'Project C',
  'project-d': 'Project D',
  'project-e': 'Project E',
  'lab': 'Lab',
  'saint': 'Saint',
};

const roomIcons: Record<string, string> = {
  'sa-core': 'SA',
  'project-a': 'PA',
  'project-b': 'PB',
  'project-c': 'PC',
  'project-d': 'PD',
  'project-e': 'PE',
  'lab': 'LB',
  'saint': 'ST',
};

const roomAccentColors: Record<string, string> = {
  'sa-core': '#58a6ff',
  'project-a': '#e3b341',
  'project-b': '#bc8cff',
  'project-c': '#56d364',
  'project-d': '#f85149',
  'project-e': '#56d4dd',
  'lab': '#ff6b9d',
  'saint': '#ffd700',
};

interface RoomStatsProps {
  offices: Record<string, OfficeHealth>;
}

export default function RoomStats({ offices }: RoomStatsProps) {
  const entries = Object.values(offices);

  const formatTimeAgo = (ts: string | null) => {
    if (!ts) return 'never';
    const diff = Date.now() - new Date(ts).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="w-56 bg-bg-panel border-l border-border flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-[11px] text-text font-bold tracking-wide uppercase">Offices</h3>
        <span className="text-[10px] text-text-dim bg-bg-card px-2 py-0.5 rounded-full font-semibold">
          {entries.length}
        </span>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto py-1">
        {entries.map((office) => {
          const color = HEALTH_CSS_COLORS[office.healthLevel];
          const name = roomNames[office.officeId] || office.officeId;
          const icon = roomIcons[office.officeId] || '??';
          const accentColor = roomAccentColors[office.officeId] || color;
          const healthPct = office.totalAgents > 0
            ? Math.round((office.activeAgents / office.totalAgents) * 100)
            : 0;
          const isHealthy = office.healthLevel === 'thriving' || office.healthLevel === 'normal';

          return (
            <div
              key={office.officeId}
              className="group mx-2 mb-1 rounded-lg hover:bg-bg-card/60 transition-all duration-150 cursor-default"
            >
              <div className="px-3 py-2.5">
                {/* Top row: icon badge + name + health */}
                <div className="flex items-center gap-2.5 mb-2">
                  {/* Room icon badge */}
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-extrabold shrink-0"
                    style={{
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                      border: `1px solid ${accentColor}30`,
                    }}
                  >
                    {icon}
                  </div>

                  {/* Name + agent count */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-text truncate">{name}</span>
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1"
                        style={{
                          color,
                          backgroundColor: `${color}15`,
                        }}
                      >
                        {healthLabels[office.healthLevel]}
                      </span>
                    </div>

                    {/* Health bar */}
                    <div className="w-full h-1 bg-bg-dark rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(healthPct, 4)}%`,
                          backgroundColor: color,
                          boxShadow: isHealthy ? `0 0 6px ${color}60` : 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-[9px] pl-[38px]">
                  <div className="flex items-center gap-1">
                    <span className="text-text font-bold">{office.activeAgents}</span>
                    <span className="text-text-dim">/ {office.totalAgents} agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {office.pendingTasks > 0 && (
                      <span className="text-active font-semibold flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-active inline-block" />
                        {office.pendingTasks}
                      </span>
                    )}
                    {office.recentErrors > 0 && (
                      <span className="text-error font-semibold flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-error inline-block" />
                        {office.recentErrors}
                      </span>
                    )}
                    <span className="text-text-dim/40">{formatTimeAgo(office.lastActivityAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-[10px] text-text-dim text-center py-10 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bg-card flex items-center justify-center">
              <span className="text-text-dim/40 text-sm">⌂</span>
            </div>
            Loading rooms...
          </div>
        )}
      </div>
    </div>
  );
}
