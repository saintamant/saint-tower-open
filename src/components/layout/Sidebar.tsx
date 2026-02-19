'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const icons: Record<string, ReactNode> = {
  office: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <line x1="6" y1="3" x2="6" y2="14" />
      <line x1="10" y1="3" x2="10" y2="14" />
      <line x1="2" y1="7" x2="14" y2="7" />
      <line x1="2" y1="11" x2="14" y2="11" />
    </svg>
  ),
  workflows: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="8" cy="4" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="13" cy="8" r="1.5" />
      <line x1="4.5" y1="7" x2="6.5" y2="5" />
      <line x1="4.5" y1="9" x2="6.5" y2="11" />
      <line x1="9.5" y1="5" x2="11.5" y2="7" />
      <line x1="9.5" y1="11" x2="11.5" y2="9" />
    </svg>
  ),
};

const menuItems = [
  { id: 'office', label: 'Office' },
  { id: 'workflows', label: 'Workflows' },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  activeWorkflowCount?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ activeView, onViewChange, activeWorkflowCount = 0, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sidebar-transition flex h-screen flex-col border-r border-sidebar-border bg-sidebar',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-bold">
          ST
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Saint Tower
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <span className="shrink-0">{icons[item.id]}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.id === 'workflows' && activeWorkflowCount > 0 && (
                <span className="ml-auto rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  {activeWorkflowCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : undefined, transition: 'transform 200ms ease' }}
          >
            <polyline points="10 4 6 8 10 12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

