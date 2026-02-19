'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Agent, OfficeHealth } from '@/types/agent';
import { TowerRenderer } from '@/pixi/engine/TowerRenderer';
import AgentTooltip from './AgentTooltip';

interface MessagingEvent {
  type: 'send' | 'receive';
  agentId: string;
  ts: number;
}

interface PixiApplicationProps {
  agents: Agent[];
  offices: Record<string, OfficeHealth>;
  onAgentClick: (agent: Agent) => void;
  workingAgentIds?: string[];
  unreadAgentIds?: string[];
  messagingEvents?: MessagingEvent[];
}

export default function PixiApplication({ agents, offices, onAgentClick, workingAgentIds = [], unreadAgentIds = [], messagingEvents = [] }: PixiApplicationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<TowerRenderer | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const renderer = new TowerRenderer({
      onAgentHover: setHoveredAgent,
      onAgentClick,
    });

    rendererRef.current = renderer;

    renderer.init(containerRef.current).then(() => {
      if (!cancelled) {
        renderer.loadAgents(agents);
      }
    });

    return () => {
      cancelled = true;
      renderer.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update agent statuses and tasks when they change
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer?.building) return;
    for (const agent of agents) {
      renderer.updateAgentStatus(agent.id, agent.status);
      renderer.updateAgentTask(agent.id, agent.currentTask || null);
    }
  }, [agents]);

  // Update working state for agent sprites
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer?.building) return;
    for (const sprite of renderer.building.agentSprites.keys()) {
      renderer.updateAgentWorking(sprite, workingAgentIds.includes(sprite));
    }
  }, [workingAgentIds]);

  // Update unread badge for agent sprites
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer?.building) return;
    for (const sprite of renderer.building.agentSprites.keys()) {
      renderer.updateAgentUnread(sprite, unreadAgentIds.includes(sprite));
    }
  }, [unreadAgentIds]);

  // Update room health when offices change
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer?.building) return;
    for (const [roomId, health] of Object.entries(offices)) {
      renderer.updateRoomHealth(roomId, health.healthLevel);
      renderer.updateRoomLastActive(roomId, health.lastActivityAt);
      renderer.updateRoomStats(roomId, health.pendingTasks, health.recentErrors, health.activeAgents);
    }
  }, [offices]);

  // Trigger send/receive flash animations
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer?.building || messagingEvents.length === 0) return;
    for (const evt of messagingEvents) {
      if (evt.type === 'send') renderer.triggerAgentSendFlash(evt.agentId);
      if (evt.type === 'receive') renderer.triggerAgentReceiveFlash(evt.agentId);
    }
  }, [messagingEvents]);

  return (
    <div
      className="relative"
      onMouseMove={handleMouseMove}
      onClick={() => containerRef.current?.focus()}
      tabIndex={-1}
    >
      <div ref={containerRef} className="flex justify-center outline-none" tabIndex={-1} />
      {hoveredAgent && (
        <AgentTooltip
          agent={hoveredAgent}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}
    </div>
  );
}
