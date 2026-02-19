'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Agent } from '@/types/agent';

interface Session {
  id: string;
  launchTime: Date;
  cwd: string;
  status: 'launching' | 'running' | 'error';
  errorMsg?: string;
}

interface SessionsTabProps {
  agent: Agent;
  onWorkingStateChange?: (agentId: string, isWorking: boolean) => void;
}

let sessionCounter = 0;

export default function SessionsTab({ agent, onWorkingStateChange }: SessionsTabProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const autoLaunched = useRef(false);
  const onWorkingRef = useRef(onWorkingStateChange);
  onWorkingRef.current = onWorkingStateChange;

  const launchSession = useCallback(async (subdir?: string) => {
    const id = `${agent.id}-${++sessionCounter}`;
    const session: Session = {
      id,
      launchTime: new Date(),
      cwd: '',
      status: 'launching',
    };

    setSessions(prev => [...prev, session]);

    try {
      const body: Record<string, string> = {};
      if (subdir) body.subdir = subdir;

      const res = await fetch(`/api/agents/${agent.id}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSessions(prev =>
          prev.map(s => s.id === id ? { ...s, status: 'running' as const, cwd: data.cwd || '' } : s)
        );
        onWorkingRef.current?.(agent.id, true);
      } else {
        setSessions(prev => {
          const next = prev.map(s => s.id === id
            ? { ...s, status: 'error' as const, errorMsg: data.error || data.detail || 'Failed to launch' }
            : s
          );
          if (!next.some(s => s.status === 'running')) {
            onWorkingRef.current?.(agent.id, false);
          }
          return next;
        });
      }
    } catch (err) {
      setSessions(prev => {
        const next = prev.map(s => s.id === id ? { ...s, status: 'error' as const, errorMsg: String(err) } : s);
        if (!next.some(s => s.status === 'running')) {
          onWorkingRef.current?.(agent.id, false);
        }
        return next;
      });
    }
  }, [agent.id]);

  // Auto-launch first session on mount
  useEffect(() => {
    if (autoLaunched.current) return;
    autoLaunched.current = true;
    launchSession();
  }, [launchSession]);

  const removeSession = (sessionId: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== sessionId);
      // If no running sessions remain, stop working indicator
      if (!next.some(s => s.status === 'running')) {
        onWorkingRef.current?.(agent.id, false);
      }
      return next;
    });
  };

  const relaunchSession = async (sessionId: string) => {
    removeSession(sessionId);
    await launchSession();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0d1117] p-4">
      {/* Header with New Session button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#e6edf3]">Sessions</span>
          <span className="text-[9px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
            {sessions.length}
          </span>
        </div>
        <button
          onClick={() => launchSession()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-[#56d364] border border-[#56d364]/30 rounded-lg hover:bg-[#56d364]/10 transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Session
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex flex-col gap-2">
        {sessions.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <span className="text-[11px] text-[#484f58]">No sessions yet</span>
          </div>
        )}

        {sessions.map(session => (
          <div
            key={session.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-[#484f58] transition-colors"
          >
            {/* Status dot */}
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              session.status === 'launching' ? 'bg-[#e3b341] animate-pulse' :
              session.status === 'running' ? 'bg-[#56d364]' :
              'bg-[#f85149]'
            }`} />

            {/* Session info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#e6edf3]">
                  {session.status === 'launching' ? 'Launching...' :
                   session.status === 'running' ? 'Running in local terminal' :
                   'Error'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-[#484f58] font-mono">
                  {formatTime(session.launchTime)}
                </span>
                {session.cwd && (
                  <>
                    <span className="text-[#30363d]">|</span>
                    <span className="text-[9px] text-[#8b949e] font-mono truncate">
                      {session.cwd}
                    </span>
                  </>
                )}
                {session.errorMsg && (
                  <span className="text-[9px] text-[#f85149] truncate">
                    {session.errorMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => relaunchSession(session.id)}
                title="Re-launch"
                className="w-7 h-7 flex items-center justify-center text-[#8b949e] hover:text-[#56d364] hover:bg-[#56d364]/10 rounded-md transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
              </button>
              <button
                onClick={() => removeSession(session.id)}
                title="Remove from list"
                className="w-7 h-7 flex items-center justify-center text-[#8b949e] hover:text-[#f85149] hover:bg-[#f85149]/10 rounded-md transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
