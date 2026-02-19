'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@/types/agent';

interface Dashboard {
  name: string;
  hasReadme: boolean;
  hasChangelog: boolean;
}

export default function LibraryTab({ agent }: { agent: Agent }) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/agents/${agent.id}/library`)
      .then(r => r.json())
      .then(data => {
        setDashboards(data.dashboards || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [agent.id]);

  const openDashboard = (name: string) => {
    setSelected(name);
  };

  const goBack = () => {
    setSelected(null);
  };

  if (selected) {
    return <DashboardLauncher agent={agent} dashboard={selected} onBack={goBack} />;
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a14] px-4 py-3">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-[11px] text-text-dim animate-pulse">Loading dashboards...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">📚</span>
            <span className="text-[11px] font-semibold text-text">Dashboards</span>
            <span className="text-[9px] text-text-dim bg-white/5 px-1.5 py-0.5 rounded">{dashboards.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {dashboards.map(d => (
              <button
                key={d.name}
                onClick={() => openDashboard(d.name)}
                className="group flex flex-col items-center gap-1.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-accent/30 hover:bg-accent/[0.04] transition-all cursor-pointer text-center"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
                <span className="text-[10px] text-text-dim group-hover:text-text transition-colors leading-tight">
                  {d.name.replace(/_/g, ' ')}
                </span>
                <div className="flex gap-1">
                  {d.hasReadme && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-accent/10 text-accent/60">README</span>
                  )}
                  {d.hasChangelog && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-idle/10 text-idle/60">CHANGELOG</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Launches Claude Code in a local terminal for a specific dashboard
function DashboardLauncher({
  agent,
  dashboard,
  onBack,
}: {
  agent: Agent;
  dashboard: string;
  onBack: () => void;
}) {
  const [status, setStatus] = useState<'launching' | 'launched' | 'error'>('launching');
  const [cwd, setCwd] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function launch() {
      try {
        const subdir = `Dashboards/${dashboard}`;
        const res = await fetch(`/api/agents/${agent.id}/launch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subdir }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok && data.success) {
          setStatus('launched');
          setCwd(data.cwd || '');
        } else {
          setStatus('error');
          setErrorMsg(data.error || data.detail || 'Failed to launch');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(String(err));
        }
      }
    }

    launch();
    return () => { cancelled = true; };
  }, [agent.id, dashboard]);

  const relaunch = async () => {
    setStatus('launching');
    setErrorMsg('');
    try {
      const subdir = `Dashboards/${dashboard}`;
      const res = await fetch(`/api/agents/${agent.id}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdir }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('launched');
        setCwd(data.cwd || '');
      } else {
        setStatus('error');
        setErrorMsg(data.error || data.detail || 'Failed to launch');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(String(err));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a12]">
      {/* Header with back button and dashboard name */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.06] bg-[#08080f] shrink-0">
        <button
          onClick={onBack}
          className="text-[10px] text-text-dim hover:text-text px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <span className="text-[10px] text-white/10">|</span>
        <span className="text-[10px]">📊</span>
        <span className="text-[11px] font-medium text-accent truncate">
          {dashboard.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Launch status */}
      <div className="flex-1 flex items-center justify-center">
        {status === 'launching' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-[#56d364]/30 border-t-[#56d364] rounded-full animate-spin" />
            <span className="text-[#56d364]/60 text-xs font-mono">
              Opening terminal for {dashboard.replace(/_/g, ' ')}...
            </span>
          </div>
        )}

        {status === 'launched' && (
          <div className="flex flex-col items-center gap-5 max-w-md text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#56d364]/10 border border-[#56d364]/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#56d364" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[#e6edf3] text-sm font-semibold">
                Running in local terminal
              </span>
              <span className="text-[#8b949e] text-xs leading-relaxed">
                Claude Code is running in Windows Terminal for this dashboard.
              </span>
            </div>

            {cwd && (
              <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                <span className="text-[10px] font-mono text-[#8b949e] truncate">{cwd}</span>
              </div>
            )}

            <button
              onClick={relaunch}
              className="mt-2 px-4 py-2 text-xs font-mono text-[#56d364] border border-[#56d364]/30 rounded-lg hover:bg-[#56d364]/10 transition-colors cursor-pointer"
            >
              Re-launch terminal
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#f85149]/10 border border-[#f85149]/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <span className="text-[#f85149]/80 text-xs font-mono">{errorMsg || 'Failed to launch'}</span>
            <button
              onClick={relaunch}
              className="px-4 py-2 text-xs font-mono text-[#56d364] border border-[#56d364]/30 rounded-lg hover:bg-[#56d364]/10 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
