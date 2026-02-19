'use client';

import { Agent } from '@/types/agent';

interface AgentTooltipProps {
  agent: Agent;
  x: number;
  y: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-active',
  idle: 'bg-idle',
  offline: 'bg-offline',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  offline: 'Offline',
};

export default function AgentTooltip({ agent, x, y }: AgentTooltipProps) {
  return (
    <div
      className="fixed z-50 pointer-events-none bg-bg-card border border-border rounded-lg px-3 py-2.5 shadow-xl shadow-black/30"
      style={{
        left: x + 16,
        top: y - 10,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
          style={{ backgroundColor: agent.spriteColor }}
        >
          {agent.displayName.charAt(0)}
        </div>
        <div>
          <div className="text-[11px] text-text font-semibold">{agent.displayName}</div>
          <div className="text-[8px] text-text-dim">{agent.role}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[9px]">
        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[agent.status]}`} />
        <span className="text-text-dim">{statusLabels[agent.status]}</span>
        <span className="text-text-dim/40">·</span>
        <span className="text-text-dim">{agent.officeId}</span>
      </div>
      {agent.currentTask && (
        <div className="text-[9px] text-active mt-1.5 pt-1.5 border-t border-border/30 max-w-[200px] truncate">
          ⚡ {agent.currentTask}
        </div>
      )}
    </div>
  );
}
