'use client';

import { useState } from 'react';
import { Agent } from '@/types/agent';
import SessionsTab from './SessionsTab';
import TasksTab from './TasksTab';
import ActivityTab from './ActivityTab';
import RepoTab from './RepoTab';
import FilesTab from './FilesTab';
import LibraryTab from './LibraryTab';
import MessagesTab from './MessagesTab';

interface AgentPanelProps {
  agent: Agent;
  allAgents?: Agent[];
  onClose: () => void;  // Kill session entirely
  onHide?: () => void;  // Just hide panel (session stays alive)
  onWorkingStateChange?: (agentId: string, isWorking: boolean) => void;
  messageCount?: number;
}

type TabId = 'sessions' | 'repo' | 'files' | 'library' | 'tasks' | 'activity' | 'messages';

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
  repoOnly?: boolean;
  agentIds?: string[];
}

// Agents that have a Dashboards library
const LIBRARY_AGENTS = ['agent-d1'];

const allTabs: TabDef[] = [
  { id: 'sessions', label: 'Terminal', icon: '>' },
  { id: 'messages', label: 'Messages', icon: '\u2709' },
  { id: 'repo', label: 'Repo', icon: '\uD83D\uDD17', repoOnly: true },
  { id: 'files', label: 'Files', icon: '\uD83D\uDCC2', repoOnly: true },
  { id: 'library', label: 'Library', icon: '\uD83D\uDCDA', agentIds: LIBRARY_AGENTS },
  { id: 'tasks', label: 'Tasks', icon: '\uD83D\uDCCB' },
  { id: 'activity', label: 'Activity', icon: '\u26A1' },
];

const statusConfig = {
  active: { color: '#56d364', bg: 'rgba(86, 211, 100, 0.12)', label: 'Online', dotClass: 'bg-active' },
  idle: { color: '#e3b341', bg: 'rgba(227, 179, 65, 0.12)', label: 'Away', dotClass: 'bg-idle' },
  offline: { color: '#6e7681', bg: 'rgba(110, 118, 129, 0.12)', label: 'Offline', dotClass: 'bg-offline' },
};

export default function AgentPanel({ agent, allAgents, onClose, onHide, onWorkingStateChange, messageCount = 0 }: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('sessions');

  const hasRepo = !!agent.githubRepo;
  const tabs = allTabs.filter(t => {
    if (t.repoOnly && !hasRepo) return false;
    if (t.agentIds && !t.agentIds.includes(agent.id)) return false;
    return true;
  });

  const status = statusConfig[agent.status];
  const repoShortName = agent.githubRepo ? agent.githubRepo.split('/')[1] : null;

  return (
    <div className="h-[600px] bg-bg-panel border-t border-border flex flex-col shrink-0 animate-[slide-up_0.2s_ease-out]">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-gradient-to-r from-bg-card/80 to-bg-panel">
        <div className="flex items-center gap-4">
          {/* Avatar with status ring */}
          <div className="relative">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-extrabold shadow-lg"
              style={{
                backgroundColor: agent.spriteColor,
                boxShadow: `0 0 0 2px ${status.color}40, 0 4px 12px ${agent.spriteColor}30`,
              }}
            >
              {agent.displayName.charAt(0)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${status.dotClass} rounded-full border-[2.5px] border-bg-panel`}
              style={{ boxShadow: `0 0 6px ${status.color}60` }}
            />
          </div>

          {/* Agent info */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2.5">
              <span className="text-[14px] font-extrabold text-text tracking-tight">{agent.displayName}</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ color: status.color, backgroundColor: status.bg }}
              >
                {status.label}
              </span>
              {repoShortName && (
                <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-md bg-info/8 text-info/70 border border-info/15">
                  {repoShortName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text-dim">
              <span className="font-semibold">{agent.role}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-text-dim/40" />
              <span className="opacity-70">{agent.officeId}</span>
              {agent.pendingTaskCount !== undefined && agent.pendingTaskCount > 0 && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-text-dim/40" />
                  <span className="text-active font-bold">{agent.pendingTaskCount} pending</span>
                </>
              )}
            </div>
            {/* Current task */}
            {agent.currentTask && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-active animate-pulse shrink-0" />
                <span className="text-[10px] text-active/80 truncate max-w-[360px] font-medium">{agent.currentTask}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onHide}
            title="Minimize (session stays alive)"
            className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-accent hover:bg-accent/10 rounded-lg transition-all duration-150 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={onClose}
            title="Close (kill session)"
            className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-error hover:bg-error/10 rounded-lg transition-all duration-150 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-b border-border/50 bg-bg-panel">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-150 cursor-pointer rounded-md flex items-center gap-1.5 ${
                isActive
                  ? 'bg-accent/12 text-accent'
                  : 'text-text-dim hover:text-text hover:bg-bg-card/50'
              }`}
            >
              <span className={`text-[10px] ${tab.id === 'sessions' ? 'font-mono font-bold' : ''}`}>{tab.icon}</span>
              {tab.label}
              {tab.id === 'messages' && messageCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-idle text-white text-[7px] font-bold flex items-center justify-center animate-pulse">
                  {messageCount}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'sessions' && <SessionsTab agent={agent} onWorkingStateChange={onWorkingStateChange} />}
        {activeTab === 'messages' && <MessagesTab agent={agent} allAgents={allAgents} />}
        {activeTab === 'repo' && hasRepo && <RepoTab agent={agent} />}
        {activeTab === 'files' && hasRepo && <FilesTab agent={agent} />}
        {activeTab === 'library' && <LibraryTab agent={agent} />}
        {activeTab === 'tasks' && <TasksTab agent={agent} />}
        {activeTab === 'activity' && <ActivityTab agent={agent} />}
      </div>
    </div>
  );
}
