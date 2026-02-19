'use client';

import { useState, useEffect } from 'react';
import { Agent, ActivityLog } from '@/types/agent';

const typeConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  task: { icon: '⚡', color: 'text-active', bg: 'bg-active', label: 'Task' },
  message: { icon: '💬', color: 'text-accent', bg: 'bg-accent', label: 'Message' },
  cron: { icon: '↻', color: 'text-idle', bg: 'bg-idle', label: 'Cron' },
  error: { icon: '!', color: 'text-[#cc4444]', bg: 'bg-[#cc4444]', label: 'Error' },
};

export default function ActivityTab({ agent }: { agent: Agent }) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    fetch(`/api/agents/${agent.id}/history`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.messages) {
          setActivities(data.messages.map((m: { id: string; text: string; timestamp: string; from: string }) => ({
            id: m.id,
            agentId: agent.id,
            type: 'message' as const,
            content: m.text,
            timestamp: m.timestamp,
          })));
        }
      })
      .catch(() => {});
  }, [agent.id]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + ' ' +
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-y-auto h-full">
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-text-dim/60 gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-40">
            <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 10V17L20 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs">No activity recorded</span>
          <span className="text-[10px] opacity-60">Activity will appear here as the agent works</span>
        </div>
      ) : (
        <div className="relative pl-8 pr-4 py-3">
          {/* Timeline vertical line */}
          <div className="absolute left-[18px] top-3 bottom-3 w-px bg-border/60" />

          {activities.map((entry, i) => {
            const config = typeConfig[entry.type] || typeConfig.message;
            const isFirst = i === 0;
            return (
              <div key={entry.id} className={`relative pb-4 ${isFirst ? '' : ''}`}>
                {/* Timeline dot */}
                <div className={`absolute -left-[21px] top-1.5 w-[7px] h-[7px] rounded-full ${config.bg} ring-[3px] ring-bg-panel`} />

                {/* Entry card */}
                <div className="group rounded-lg px-3 py-2.5 hover:bg-bg-card/40 transition-colors duration-100 -ml-1">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold ${config.color}`}>
                      {config.icon} {config.label}
                    </span>
                    <span className="text-[9px] text-text-dim/50 ml-auto">{formatTime(entry.timestamp)}</span>
                  </div>

                  {/* Content */}
                  <div className="text-[11px] text-text/90 leading-relaxed">
                    {entry.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
