'use client';

import { useState, useEffect } from 'react';
import { Agent, RepoInfo } from '@/types/agent';

type SubTab = 'commits' | 'prs' | 'issues';

export default function RepoTab({ agent }: { agent: Agent }) {
  const [info, setInfo] = useState<RepoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>('commits');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/agents/${agent.id}/repo`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.repo) setInfo(data.repo); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agent.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-dim text-xs">
        Loading repository...
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex items-center justify-center h-full text-text-dim text-xs">
        Could not load repository data.
      </div>
    );
  }

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const subTabs: { id: SubTab; label: string; count: number }[] = [
    { id: 'commits', label: 'Commits', count: info.recentCommits.length },
    { id: 'prs', label: 'PRs', count: info.openPRs.length },
    { id: 'issues', label: 'Issues', count: info.openIssues.length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 bg-bg-card/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text font-mono">{info.fullName}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">
            {info.language}
          </span>
        </div>
        <div className="text-[10px] text-text-dim mt-1">
          Branch: <span className="font-mono text-text/70">{info.defaultBranch}</span>
        </div>
      </div>

      {/* Sub-tab pills */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border/40">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === tab.id
                ? 'bg-accent/15 text-accent'
                : 'text-text-dim hover:text-text hover:bg-bg-card/60'
            }`}
          >
            {tab.label}
            <span className={`text-[9px] px-1 py-0 rounded-full ${
              subTab === tab.id ? 'bg-accent/20' : 'bg-bg-card/80'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {subTab === 'commits' && (
          <div className="space-y-1.5">
            {info.recentCommits.length === 0 && (
              <div className="text-text-dim text-[11px] py-4 text-center">No recent commits</div>
            )}
            {info.recentCommits.map(c => (
              <div key={c.sha} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0">
                <span className="font-mono text-[10px] text-accent/80 shrink-0 mt-0.5">{c.sha}</span>
                <div className="flex-1 min-w-0">
                  <div title={c.message} className="text-[11px] text-text truncate">{c.message}</div>
                  <div className="text-[9px] text-text-dim mt-0.5">
                    {c.author} &middot; {relativeTime(c.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'prs' && (
          <div className="space-y-1.5">
            {info.openPRs.length === 0 && (
              <div className="text-text-dim text-[11px] py-4 text-center">No open pull requests</div>
            )}
            {info.openPRs.map(pr => (
              <div key={pr.number} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0">
                <span className="text-[10px] text-active font-mono shrink-0 mt-0.5">#{pr.number}</span>
                <div className="flex-1 min-w-0">
                  <div title={pr.title} className="text-[11px] text-text truncate">{pr.title}</div>
                  <div className="text-[9px] text-text-dim mt-0.5">
                    {pr.author} &middot; {relativeTime(pr.createdAt)}
                    <span className="ml-1.5 px-1 py-0 rounded text-[8px] bg-active/15 text-active">{pr.state}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'issues' && (
          <div className="space-y-1.5">
            {info.openIssues.length === 0 && (
              <div className="text-text-dim text-[11px] py-4 text-center">No open issues</div>
            )}
            {info.openIssues.map(issue => (
              <div key={issue.number} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0">
                <span className="text-[10px] text-idle font-mono shrink-0 mt-0.5">#{issue.number}</span>
                <div className="flex-1 min-w-0">
                  <div title={issue.title} className="text-[11px] text-text truncate">{issue.title}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] text-text-dim">{issue.author}</span>
                    {issue.labels.map(l => (
                      <span key={l} className="text-[8px] px-1 py-0 rounded bg-accent/10 text-accent/70">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
