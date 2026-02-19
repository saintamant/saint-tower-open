'use client';

import { useState, useEffect } from 'react';
import { Agent, Task } from '@/types/agent';

const statusConfig: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  pending: { icon: '○', label: 'Pending', color: 'text-idle', bg: 'bg-idle/10', border: 'border-l-idle' },
  in_progress: { icon: '◉', label: 'In Progress', color: 'text-active', bg: 'bg-active/10', border: 'border-l-active' },
  completed: { icon: '✓', label: 'Done', color: 'text-text-dim', bg: 'bg-bg-card/50', border: 'border-l-text-dim/30' },
};

const statusCycle: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
};

export default function TasksTab({ agent }: { agent: Agent }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [creating, setCreating] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${agent.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.tasks) setTasks(data.tasks);
      })
      .catch(() => {});
  }, [agent.id]);

  const createTask = async () => {
    if (!newTask.trim() || creating) return;

    setCreating(true);
    const description = newTask.trim();
    setNewTask('');

    try {
      const res = await fetch(`/api/agents/${agent.id}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, type: 'task' }),
      });
      const data = await res.json();

      setTasks(prev => [data.task || {
        id: Date.now(),
        agentId: agent.id,
        description,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }, ...prev]);
    } catch {
      setTasks(prev => [{
        id: Date.now(),
        agentId: agent.id,
        description,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }, ...prev]);
    }

    setCreating(false);
  };

  const cycleStatus = async (task: Task) => {
    const nextStatus = statusCycle[task.status] || 'pending';

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: nextStatus as Task['status'] } : t
    ));

    // If completing, update agent current_task too
    const updates: Record<string, unknown> = {};
    if (nextStatus === 'in_progress') {
      updates.currentTask = task.description;
      updates.status = 'active';
    } else if (nextStatus === 'completed') {
      updates.currentTask = null;
    }

    // Persist status change
    try {
      // Update task status in DB
      await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // Silent
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="flex flex-col h-full">
      {/* New task input */}
      <div className={`flex items-center mx-4 mt-3 mb-2 rounded-lg border transition-all duration-200 ${
        focused ? 'border-accent/50 bg-bg-dark shadow-[0_0_0_3px_rgba(86,211,100,0.08)]' : 'border-border bg-bg-dark/60'
      }`}>
        <div className="pl-3 text-text-dim">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 4.5V9.5M4.5 7H9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <input
          type="text"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createTask()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Assign a new task..."
          className="flex-1 bg-transparent text-text text-xs px-2.5 py-2.5 outline-none placeholder:text-text-dim/60"
        />
        {newTask.trim() && (
          <button
            onClick={createTask}
            disabled={creating}
            className="mr-1.5 px-3 py-1.5 bg-accent text-white text-[10px] font-semibold rounded-md hover:bg-accent/80 transition-colors cursor-pointer disabled:opacity-40"
          >
            {creating ? '...' : 'Assign'}
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 pb-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-dim/60 gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-40">
              <rect x="6" y="4" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11H21M11 15H21M11 19H17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-xs">No tasks assigned yet</span>
            <span className="text-[10px] opacity-60">Type above to assign a task to this agent</span>
          </div>
        ) : (
          <>
            {/* Active / Pending tasks */}
            {pending.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] text-text-dim font-semibold uppercase tracking-wider mb-2">
                  Active ({pending.length})
                </div>
                <div className="space-y-1.5">
                  {pending.map(task => {
                    const cfg = statusConfig[task.status] || statusConfig.pending;
                    return (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border-l-[3px] ${cfg.border} ${cfg.bg} transition-colors duration-150 hover:brightness-110`}
                      >
                        {/* Clickable status icon — cycles through states */}
                        <button
                          onClick={() => cycleStatus(task)}
                          title={`Click to change status (${cfg.label})`}
                          className={`text-sm font-bold mt-0.5 ${cfg.color} ${task.status === 'in_progress' ? 'animate-pulse' : ''} cursor-pointer hover:scale-125 transition-transform`}
                        >
                          {cfg.icon}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div title={task.description} className="text-xs text-text leading-relaxed">{task.description}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              onClick={() => cycleStatus(task)}
                              className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} cursor-pointer hover:brightness-125 transition-all`}
                              title="Click to change status"
                            >
                              {cfg.label}
                            </button>
                            <span className="text-[9px] text-text-dim/60">{formatTime(task.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed tasks */}
            {completed.length > 0 && (
              <div>
                <div className="text-[10px] text-text-dim/60 font-semibold uppercase tracking-wider mb-2">
                  Completed ({completed.length})
                </div>
                <div className="space-y-1">
                  {completed.map(task => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 px-3 py-2 rounded-lg opacity-50 hover:opacity-70 transition-opacity"
                    >
                      <button
                        onClick={() => cycleStatus(task)}
                        title="Click to reopen"
                        className="text-xs text-active mt-0.5 cursor-pointer hover:scale-125 transition-transform"
                      >
                        ✓
                      </button>
                      <div className="flex-1 min-w-0">
                        <div title={task.description} className="text-[11px] text-text-dim line-through">{task.description}</div>
                        <span className="text-[9px] text-text-dim/50">{formatTime(task.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
