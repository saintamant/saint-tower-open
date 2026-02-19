'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { Agent, OfficeHealth } from '@/types/agent';
import { WorkflowRunSummary } from '@/types/workflow';
import { agents as staticAgents } from '@/data/agents';
import OfficeCanvas from '@/components/office/OfficeCanvas';
import AgentPanel from '@/components/panels/AgentPanel';
import AgentList from '@/components/panels/AgentList';
import WorkflowPanel, { WorkflowSubView } from '@/components/workflows/WorkflowPanel';
import { TopNavbar } from '@/components/layout/TopNavbar';

interface MessagingEvent {
  type: 'send' | 'receive';
  agentId: string;
  ts: number;
}

interface TowerState {
  activeView: string;
  agents: Agent[];
  offices: Record<string, OfficeHealth>;
  selectedAgentId: string | null;
  openAgentIds: string[]; // All agents with live terminal sessions
  workingAgentIds: string[]; // Agents actively producing terminal output
  unreadAgentIds: string[]; // Agents with unread responses
  activeWorkflowRuns: WorkflowRunSummary[];
  pendingMessageCounts: Record<string, number>;
  messagingEvents: MessagingEvent[];
  workflowSubView: WorkflowSubView;
  selectedWorkflowId: number | null;
  selectedRunId: number | null;
}

type TowerAction =
  | { type: 'SET_VIEW'; view: string }
  | { type: 'SET_AGENTS'; agents: Agent[] }
  | { type: 'SET_OFFICES'; offices: Record<string, OfficeHealth> }
  | { type: 'SELECT_AGENT'; agentId: string | null }
  | { type: 'TOGGLE_AGENT'; agent: Agent }
  | { type: 'CLOSE_AGENT'; agentId: string }
  | { type: 'SET_WORKING'; agentId: string; isWorking: boolean }
  | { type: 'CLEAR_UNREAD'; agentId: string }
  | { type: 'SET_WORKFLOW_RUNS'; runs: WorkflowRunSummary[] }
  | { type: 'SET_MESSAGE_COUNTS'; counts: Record<string, number> }
  | { type: 'SET_MESSAGING_EVENTS'; events: MessagingEvent[] }
  | { type: 'NAVIGATE_WORKFLOW'; subView: WorkflowSubView; runId?: number; workflowId?: number };

function reducer(state: TowerState, action: TowerAction): TowerState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.view };
    case 'SET_AGENTS': {
      const openSet = new Set(state.openAgentIds);
      const merged = action.agents.map(a => ({
        ...a,
        status: openSet.has(a.id) ? 'active' as const : a.status,
      }));
      return { ...state, agents: merged };
    }
    case 'SET_OFFICES':
      return { ...state, offices: action.offices };
    case 'SELECT_AGENT':
      return {
        ...state,
        selectedAgentId: action.agentId,
        unreadAgentIds: action.agentId
          ? state.unreadAgentIds.filter(id => id !== action.agentId)
          : state.unreadAgentIds,
      };
    case 'TOGGLE_AGENT': {
      const agentId = action.agent.id;
      if (state.selectedAgentId === agentId) {
        return { ...state, selectedAgentId: null };
      }
      const openAgentIds = state.openAgentIds.includes(agentId)
        ? state.openAgentIds
        : [...state.openAgentIds, agentId];
      const agents = state.agents.map(a =>
        a.id === agentId ? { ...a, status: 'active' as const } : a
      );
      return {
        ...state,
        selectedAgentId: agentId,
        openAgentIds,
        agents,
        unreadAgentIds: state.unreadAgentIds.filter(id => id !== agentId),
      };
    }
    case 'CLOSE_AGENT': {
      return {
        ...state,
        openAgentIds: state.openAgentIds.filter(id => id !== action.agentId),
        workingAgentIds: state.workingAgentIds.filter(id => id !== action.agentId),
        selectedAgentId: state.selectedAgentId === action.agentId ? null : state.selectedAgentId,
      };
    }
    case 'SET_WORKING': {
      const has = state.workingAgentIds.includes(action.agentId);
      if (action.isWorking && !has) {
        const agents = state.agents.map(a =>
          a.id === action.agentId ? { ...a, status: 'active' as const } : a
        );
        return {
          ...state,
          workingAgentIds: [...state.workingAgentIds, action.agentId],
          unreadAgentIds: state.unreadAgentIds.filter(id => id !== action.agentId),
          agents,
        };
      }
      if (!action.isWorking && has) {
        const isViewing = state.selectedAgentId === action.agentId;
        const unreadAgentIds = isViewing
          ? state.unreadAgentIds
          : state.unreadAgentIds.includes(action.agentId)
            ? state.unreadAgentIds
            : [...state.unreadAgentIds, action.agentId];
        return {
          ...state,
          workingAgentIds: state.workingAgentIds.filter(id => id !== action.agentId),
          unreadAgentIds,
        };
      }
      return state;
    }
    case 'CLEAR_UNREAD':
      return {
        ...state,
        unreadAgentIds: state.unreadAgentIds.filter(id => id !== action.agentId),
      };
    case 'SET_WORKFLOW_RUNS':
      return { ...state, activeWorkflowRuns: action.runs };
    case 'SET_MESSAGE_COUNTS':
      return { ...state, pendingMessageCounts: action.counts };
    case 'SET_MESSAGING_EVENTS':
      return { ...state, messagingEvents: action.events };
    case 'NAVIGATE_WORKFLOW':
      return {
        ...state,
        workflowSubView: action.subView,
        selectedRunId: action.runId ?? null,
        selectedWorkflowId: action.workflowId ?? null,
      };
    default:
      return state;
  }
}

const initialState: TowerState = {
  activeView: 'office',
  agents: staticAgents,
  offices: {},
  selectedAgentId: null,
  openAgentIds: [],
  workingAgentIds: [],
  unreadAgentIds: [],
  activeWorkflowRuns: [],
  pendingMessageCounts: {},
  messagingEvents: [],
  workflowSubView: 'list' as WorkflowSubView,
  selectedWorkflowId: null,
  selectedRunId: null,
};

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const prevMessageCountsRef = useRef<Record<string, number>>({});
  const seenMessageIdsRef = useRef<Set<number>>(new Set());

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        if (data.agents?.length) {
          dispatch({ type: 'SET_AGENTS', agents: data.agents });
        }
      }
    } catch {
      // Use static data on error
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        if (data.offices) {
          dispatch({ type: 'SET_OFFICES', offices: data.offices });
        }
        if (data.activeWorkflowRuns) {
          dispatch({ type: 'SET_WORKFLOW_RUNS', runs: data.activeWorkflowRuns });
        }
        if (data.pendingMessageCounts) {
          const newCounts: Record<string, number> = data.pendingMessageCounts;
          dispatch({ type: 'SET_MESSAGE_COUNTS', counts: newCounts });

          const prev = prevMessageCountsRef.current;
          for (const [agentId, count] of Object.entries(newCounts)) {
            if (count > (prev[agentId] || 0)) {
              fetch(`/api/agents/${agentId}/refresh-inbox`, { method: 'POST' }).catch(() => {});
            }
          }
          prevMessageCountsRef.current = newCounts;
        }
        // Detect new messaging events for send/receive flash animations
        if (data.recentMessages?.length) {
          const events: MessagingEvent[] = [];
          for (const msg of data.recentMessages as Array<{ id: number; from: string; to: string }>) {
            if (!seenMessageIdsRef.current.has(msg.id)) {
              seenMessageIdsRef.current.add(msg.id);
              events.push({ type: 'send', agentId: msg.from, ts: Date.now() });
              events.push({ type: 'receive', agentId: msg.to, ts: Date.now() });
            }
          }
          if (events.length > 0) {
            dispatch({ type: 'SET_MESSAGING_EVENTS', events });
          }
          // Prune seen IDs to prevent unbounded growth
          if (seenMessageIdsRef.current.size > 200) {
            const ids = [...seenMessageIdsRef.current];
            seenMessageIdsRef.current = new Set(ids.slice(-100));
          }
        }
      }
      await fetchAgents();
    } catch {
      // Silent fail
    }
  }, [fetchAgents]);

  useEffect(() => {
    fetchStatus();
    const statusInterval = setInterval(fetchStatus, 10000);
    return () => clearInterval(statusInterval);
  }, [fetchStatus]);

  // Keyboard shortcut: Escape hides agent panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.selectedAgentId) {
        dispatch({ type: 'SELECT_AGENT', agentId: null });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.selectedAgentId]);

  const handleAgentClick = useCallback((agent: Agent) => {
    dispatch({ type: 'TOGGLE_AGENT', agent });
  }, []);

  const handleWorkingStateChange = useCallback((agentId: string, isWorking: boolean) => {
    dispatch({ type: 'SET_WORKING', agentId, isWorking });
  }, []);

  const agentMap = new Map(state.agents.map(a => [a.id, a]));

  const isWorkflowView = state.activeView === 'workflows';

  const handleWorkflowNavigate = useCallback((subView: WorkflowSubView, opts?: { runId?: number; workflowId?: number }) => {
    dispatch({ type: 'NAVIGATE_WORKFLOW', subView, runId: opts?.runId, workflowId: opts?.workflowId });
  }, []);

  const activeCount = state.agents.filter(a => a.status === 'active').length;
  const idleCount = state.agents.filter(a => a.status === 'idle').length;
  const offlineCount = state.agents.filter(a => a.status === 'offline').length;

  return (
    <div className="h-screen flex">
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <TopNavbar
          activeView={state.activeView}
          workflowSubView={state.workflowSubView}
          onViewChange={(view) => dispatch({ type: 'SET_VIEW', view })}
          onWorkflowNavigate={(subView) => dispatch({ type: 'NAVIGATE_WORKFLOW', subView: subView as WorkflowSubView })}
          activeCount={activeCount}
          idleCount={idleCount}
          offlineCount={offlineCount}
          onSync={fetchStatus}
        />

        {isWorkflowView ? (
          <WorkflowPanel
            subView={state.workflowSubView}
            selectedRunId={state.selectedRunId}
            selectedWorkflowId={state.selectedWorkflowId}
            onNavigate={handleWorkflowNavigate}
            showHeader={true}
          />
        ) : (
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              <div className="shrink-0">
                <OfficeCanvas
                  agents={state.agents}
                  offices={state.offices}
                  onAgentClick={handleAgentClick}
                  workingAgentIds={state.workingAgentIds}
                  unreadAgentIds={state.unreadAgentIds}
                  messagingEvents={state.messagingEvents}
                />
              </div>

              {/* Session tabs */}
              {state.openAgentIds.length > 0 && (
                <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-bg-card border-t border-b border-border">
                  <span className="text-[10px] text-text-dim font-semibold uppercase tracking-wider mr-2">Sessions</span>
                  {state.openAgentIds.map(id => {
                    const a = agentMap.get(id);
                    if (!a) return null;
                    const isActive = state.selectedAgentId === id;
                    const isWorking = state.workingAgentIds.includes(id);
                    const isUnread = state.unreadAgentIds.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => dispatch({ type: isActive ? 'SELECT_AGENT' : 'TOGGLE_AGENT', ...(isActive ? { agentId: null } : { agent: a }) } as TowerAction)}
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer border ${
                          isActive
                            ? 'bg-[#0a1e1e] text-accent border-[#1a3a35]'
                            : isUnread
                              ? 'bg-[#1a1700] text-idle border-[#3a3000]'
                              : 'bg-transparent text-text-dim border-transparent hover:bg-[#1a1a1a] hover:text-text hover:border-border'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isWorking ? 'bg-active animate-pulse' : isUnread ? 'bg-idle animate-pulse' : isActive ? 'bg-accent' : 'bg-[#555]'
                        }`} />
                        <span className="truncate max-w-[80px]">{a.displayName}</span>
                        {isUnread && !isActive && (
                          <span className="w-2 h-2 rounded-full bg-idle animate-pulse" />
                        )}
                        <span
                          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'CLOSE_AGENT', agentId: id }); }}
                          className="ml-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-error transition-opacity cursor-pointer"
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 1.5L6.5 6.5M1.5 6.5L6.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          </svg>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Agent panels */}
              {state.openAgentIds.map(agentId => {
                const agent = agentMap.get(agentId);
                if (!agent) return null;
                const isVisible = state.selectedAgentId === agentId;
                return (
                  <div
                    key={agentId}
                    style={{ display: isVisible ? 'flex' : 'none' }}
                    className="flex-col"
                  >
                    <AgentPanel
                      agent={agent}
                      allAgents={state.agents}
                      onClose={() => dispatch({ type: 'CLOSE_AGENT', agentId })}
                      onHide={() => dispatch({ type: 'SELECT_AGENT', agentId: null })}
                      onWorkingStateChange={handleWorkingStateChange}
                      messageCount={state.pendingMessageCounts[agentId] || 0}
                    />
                  </div>
                );
              })}
            </div>

            {/* Agent list sidebar */}
            <AgentList
              agents={state.agents}
              workingAgentIds={state.workingAgentIds}
              unreadAgentIds={state.unreadAgentIds}
              selectedAgentId={state.selectedAgentId}
              onAgentClick={handleAgentClick}
              pendingMessageCounts={state.pendingMessageCounts}
            />
          </div>
        )}
      </div>
    </div>
  );
}










