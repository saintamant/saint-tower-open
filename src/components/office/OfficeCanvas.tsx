'use client';

import dynamic from 'next/dynamic';
import { Agent, OfficeHealth } from '@/types/agent';

const PixiApplication = dynamic(() => import('./PixiApplication'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-text-dim text-[8px]">
      Loading office...
    </div>
  ),
});

interface MessagingEvent {
  type: 'send' | 'receive';
  agentId: string;
  ts: number;
}

interface OfficeCanvasProps {
  agents: Agent[];
  offices: Record<string, OfficeHealth>;
  onAgentClick: (agent: Agent) => void;
  workingAgentIds?: string[];
  unreadAgentIds?: string[];
  messagingEvents?: MessagingEvent[];
}

export default function OfficeCanvas({ agents, offices, onAgentClick, workingAgentIds, unreadAgentIds, messagingEvents }: OfficeCanvasProps) {
  return (
    <div className="h-full flex items-center justify-center bg-bg-dark overflow-auto">
      <PixiApplication agents={agents} offices={offices} onAgentClick={onAgentClick} workingAgentIds={workingAgentIds} unreadAgentIds={unreadAgentIds} messagingEvents={messagingEvents} />
    </div>
  );
}
