'use client';

import { useState, useEffect, useRef } from 'react';
import { ActivityLog } from '@/types/agent';

const typeColors: Record<string, string> = {
  task: 'bg-active',
  message: 'bg-info',
  cron: 'bg-idle',
  error: 'bg-error',
  session: 'bg-warning',
  commit: 'bg-commit',
  workflow: 'bg-accent',
  agent_message: 'bg-info',
};

const typeBorderColors: Record<string, string> = {
  task: 'border-l-active',
  message: 'border-l-info',
  cron: 'border-l-idle',
  error: 'border-l-error',
  session: 'border-l-warning',
  commit: 'border-l-commit',
  workflow: 'border-l-accent',
  agent_message: 'border-l-info',
};

const typeTextColors: Record<string, string> = {
  task: 'text-active',
  message: 'text-info',
  cron: 'text-idle',
  error: 'text-error',
  session: 'text-warning',
  commit: 'text-commit',
  workflow: 'text-accent',
  agent_message: 'text-info',
};

const FILTER_TYPES = ['session', 'commit', 'task', 'message', 'error', 'workflow'] as const;

const filterDotColors: Record<string, string> = {
  session: 'bg-warning',
  commit: 'bg-commit',
  task: 'bg-active',
  message: 'bg-info',
  error: 'bg-error',
  workflow: 'bg-accent',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set(FILTER_TYPES));
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | null>(null);

  const fetchActivity = async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (lastTimestampRef.current) {
        params.set('since', lastTimestampRef.current);
      }
      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.activities?.length) {
        setActivities(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newItems = data.activities.filter((a: ActivityLog) => !existingIds.has(a.id));
          const merged = [...newItems, ...prev].slice(0, 100);
          if (merged.length > 0) {
            lastTimestampRef.current = merged[0].timestamp;
          }
          return merged;
        });
      }
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities]);

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filtered = activities.filter(a => activeFilters.has(a.type));

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-60 bg-bg-panel border-r border-border flex flex-col shrink-0 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[10px] text-text-dim font-semibold tracking-wider uppercase">Activity</h3>
        <span className="text-[9px] text-text-dim bg-bg-card px-1.5 py-0.5 rounded-full font-medium">
          {filtered.length}
        </span>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1 px-2.5 py-2 border-b border-border/40">
        {FILTER_TYPES.map(type => {
          const isOn = activeFilters.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium transition-all cursor-pointer border ${
                isOn
                  ? 'bg-bg-card border-border/60 text-text'
                  : 'bg-transparent border-transparent text-text-dim/40 line-through'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOn ? filterDotColors[type] : 'bg-text-dim/20'}`} />
              {type}
            </button>
          );
        })}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-[10px] text-text-dim text-center py-8 flex flex-col items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-text-dim/30" />
            No activity yet
          </div>
        ) : (
          filtered.map((entry) => {
            const dotColor = typeColors[entry.type] || typeColors.message;
            const borderColor = typeBorderColors[entry.type] || typeBorderColors.message;
            const textColor = typeTextColors[entry.type] || typeTextColors.message;
            return (
              <div
                key={entry.id}
                className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-border/20 border-l-2 ${borderColor} hover:bg-bg-card/30 transition-colors duration-100 animate-slide-in`}
              >
                {/* Colored dot instead of emoji */}
                <div className="shrink-0 mt-1.5">
                  <span className={`block w-2 h-2 rounded-full ${dotColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text font-semibold truncate">
                      {entry.agentDisplayName || entry.agentId}
                    </span>
                    <span className="text-[9px] text-text-dim/60 shrink-0">{formatTime(entry.timestamp)}</span>
                  </div>
                  <div title={entry.content} className={`text-[11px] ${textColor} truncate mt-0.5 leading-relaxed`}>
                    {entry.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
