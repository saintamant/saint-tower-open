'use client';

import type { ReactNode } from 'react';
import { Agent, OfficeHealth } from '@/types/agent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StatusPillsProps {
  agents: Agent[];
  offices: Record<string, OfficeHealth>;
}

export function StatusPills({ agents, offices }: StatusPillsProps) {
  const activeCount = agents.filter(a => a.status === 'active').length;
  const idleCount = agents.filter(a => a.status === 'idle').length;
  const offlineCount = agents.filter(a => a.status === 'offline').length;
  const errorCount = Object.values(offices).reduce((sum, office) => sum + office.recentErrors, 0);

  return (
    <ScrollArea className="max-w-full">
      <div className="flex min-w-max items-center gap-1.5 pb-0.5">
        <StatusChip tone="active" label="Active" count={activeCount} />
        <StatusChip tone="idle" label="Idle" count={idleCount} />
        <StatusChip tone="offline" label="Offline" count={offlineCount} />
        {errorCount > 0 && <StatusChip tone="error" label="Errors" count={errorCount} pulse />}
      </div>
    </ScrollArea>
  );
}

function StatusChip({ tone, label, count, pulse }: { tone: 'active' | 'idle' | 'offline' | 'error'; label: string; count: number; pulse?: boolean }) {
  const toneClass: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    idle: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    offline: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const dotClass: Record<string, string> = {
    active: 'bg-emerald-400',
    idle: 'bg-amber-400',
    offline: 'bg-zinc-500',
    error: 'bg-red-400',
  };

  return (
    <Badge variant="outline" className={`gap-1.5 rounded-full py-0.5 pl-2 pr-2.5 text-[11px] font-medium normal-case tracking-normal ${toneClass[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass[tone]} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="font-mono tabular-nums">{count}</span>
      <span>{label}</span>
    </Badge>
  );
}

interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  agents: Agent[];
  offices: Record<string, OfficeHealth>;
  onRefresh: () => void;
}

export function ContentHeader({ title, subtitle, agents, offices, onRefresh }: ContentHeaderProps) {
  return (
    <header className="shrink-0 flex h-14 items-center border-b border-border bg-background/80 backdrop-blur-md px-4">
      <div className="flex w-full items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        <Separator orientation="vertical" className="h-5" />

        <div className="hidden md:flex min-w-0 flex-1">
          <StatusPills agents={agents} offices={offices} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} className="h-8 text-xs">
            <SyncIcon />
            Sync
          </Button>
        </div>
      </div>
    </header>
  );
}

function SyncIcon(): ReactNode {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 3v4H9" />
      <path d="M3 13V9h4" />
      <path d="M4.5 6.5a5 5 0 0 1 8.2-1.6L13 7" />
      <path d="M11.5 9.5A5 5 0 0 1 3.3 11L3 9" />
    </svg>
  );
}

export default function Header({ agents, offices, onRefresh }: { agents: Agent[]; offices: Record<string, OfficeHealth>; onRefresh: () => void }) {
  return <ContentHeader title="Saint Tower" agents={agents} offices={offices} onRefresh={onRefresh} />;
}

