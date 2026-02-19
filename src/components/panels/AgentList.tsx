'use client';

import { Agent } from '@/types/agent';
import SpriteAvatar from '../office/SpriteAvatar';

interface AgentListProps {
  agents: Agent[];
  workingAgentIds: string[];
  unreadAgentIds: string[];
  selectedAgentId: string | null;
  onAgentClick: (agent: Agent) => void;
  pendingMessageCounts?: Record<string, number>;
}

const officeConfig: Record<string, { name: string; color: string }> = {
  'saint':      { name: 'Saint',        color: '#ffd700' },
  'sa-core':    { name: 'SA Core',      color: '#10b981' },
  'lab':        { name: 'Lab',           color: '#ec4899' },
  'project-a':  { name: 'Project A',    color: '#eab308' },
  'project-b':  { name: 'Project B',    color: '#a78bfa' },
  'project-c':  { name: 'Project C',    color: '#22c55e' },
  'project-d':  { name: 'Project D',    color: '#ef4444' },
  'project-e':  { name: 'Project E',    color: '#06b6d4' },
  'library':    { name: 'Library',       color: '#06b6d4' },
};

const officeOrder = ['saint', 'sa-core', 'lab', 'project-a', 'project-b', 'project-c', 'project-d', 'project-e', 'library'];

export default function AgentList({ agents, workingAgentIds, unreadAgentIds, selectedAgentId, onAgentClick, pendingMessageCounts = {} }: AgentListProps) {
  const working = new Set(workingAgentIds);
  const unread = new Set(unreadAgentIds);

  // Group by officeId
  const byOffice = new Map<string, Agent[]>();
  for (const agent of agents) {
    const office = agent.officeId || 'other';
    if (!byOffice.has(office)) byOffice.set(office, []);
    byOffice.get(office)!.push(agent);
  }

  const sortedOffices = [...byOffice.entries()].sort(([a], [b]) => {
    const ia = officeOrder.indexOf(a);
    const ib = officeOrder.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const onlineCount = agents.filter(a => a.status === 'active').length;

  return (
    <div
      className="w-64 flex flex-col shrink-0 overflow-hidden bg-bg-panel"
      style={{ borderLeft: '1px solid #1e1e1e' }}
    >
      {/* Header */}
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: '#e8e8e8' }}>Agents</h3>
        <p className="text-[10px] mt-0.5 font-mono" style={{ color: '#555' }}>
          {onlineCount} online &middot; {agents.length} total
        </p>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto py-1">
        {sortedOffices.map(([officeId, officeAgents]) => {
          const office = officeConfig[officeId] || { name: officeId, color: '#6b7280' };

          return (
            <div key={officeId} className="mb-0.5">
              {/* Office header */}
              <div className="flex items-center gap-2 mx-4 mt-3 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: office.color }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#555' }}>
                  {office.name}
                </span>
              </div>

              {/* Agents */}
              <div className="px-2 flex flex-col gap-px">
                {officeAgents.map((agent) => {
                  const isWorking = working.has(agent.id);
                  const isUnread = unread.has(agent.id);
                  const isSelected = selectedAgentId === agent.id;
                  const isOwner = agent.id === 'juan';
                  const msgCount = pendingMessageCounts[agent.id] || 0;

                  let statusLabel: string;
                  let statusColor: string;
                  if (isWorking) {
                    statusLabel = 'Working';
                    statusColor = '#22c55e';
                  } else if (agent.status === 'active') {
                    statusLabel = 'Online';
                    statusColor = '#10b981';
                  } else if (agent.status === 'idle') {
                    statusLabel = 'Idle';
                    statusColor = '#eab308';
                  } else {
                    statusLabel = 'Offline';
                    statusColor = '#6b7280';
                  }

                  return (
                    <div
                      key={agent.id}
                      onClick={() => onAgentClick(agent)}
                      className={`rounded-md transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-[#141414] border border-[#1e1e1e]'
                          : 'border border-transparent hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 px-2 py-1.5">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="rounded-md overflow-hidden" style={{ background: '#141414' }}>
                            <SpriteAvatar agentId={agent.id} size={30} />
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${
                              isWorking ? 'animate-pulse' : ''
                            }`}
                            style={{
                              backgroundColor: statusColor,
                              border: '2px solid var(--color-bg-panel)',
                            }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isOwner && (
                              <span className="text-[9px] text-amber-400 font-bold leading-none">★</span>
                            )}
                            <span className="text-[11px] font-medium truncate group-hover:text-white transition-colors" style={{ color: '#ccc' }}>
                              {agent.displayName}
                            </span>
                            {isUnread && (
                              <span
                                className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                                style={{ backgroundColor: '#eab308' }}
                              />
                            )}
                            {msgCount > 0 && (
                              <span
                                className="text-[7px] font-bold text-white rounded-full w-3.5 h-3.5 flex items-center justify-center shrink-0"
                                style={{ background: '#10b981' }}
                              >
                                {msgCount}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-medium" style={{ color: statusColor }}>
                              {statusLabel}
                            </span>
                            <span className="text-[9px] truncate" style={{ color: '#444' }}>{agent.role}</span>
                          </div>

                          {agent.currentTask && (
                            <p className="text-[9px] truncate mt-0.5" style={{ color: '#22c55e' }}>
                              {agent.currentTask}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
