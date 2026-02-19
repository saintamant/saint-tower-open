'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@/types/agent';
import { AgentMessage } from '@/types/workflow';

interface MessagesTabProps {
  agent: Agent;
  allAgents?: Agent[];
}

export default function MessagesTab({ agent, allAgents = [] }: MessagesTabProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendTo, setSendTo] = useState('');
  const [sendContent, setSendContent] = useState('');
  const [sending, setSending] = useState(false);
  const [delivering, setDelivering] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/agents/${agent.id}/inbox`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  const handleSend = async () => {
    if (!sendTo || !sendContent.trim()) return;
    setSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAgentId: agent.id,
          toAgentId: sendTo,
          content: sendContent.trim(),
          messageType: 'message',
        }),
      });
      setSendContent('');
      fetchMessages();
    } catch {
      // Silent
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const typeBadge: Record<string, { label: string; color: string; bg: string }> = {
    message: { label: 'MSG', color: '#58a6ff', bg: 'rgba(88,166,255,0.12)' },
    request: { label: 'REQ', color: '#e3b341', bg: 'rgba(227,179,65,0.12)' },
    handoff: { label: 'HANDOFF', color: '#56d364', bg: 'rgba(86,211,100,0.12)' },
  };

  const statusDot: Record<string, string> = {
    pending: 'bg-idle',
    delivered: 'bg-info',
    read: 'bg-text-dim/40',
  };

  const handleDeliver = async () => {
    setDelivering(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/refresh-inbox`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.messageCount > 0) fetchMessages();
      }
    } catch {
      // Silent
    } finally {
      setDelivering(false);
    }
  };

  const otherAgents = allAgents.filter(a => a.id !== agent.id);

  return (
    <div className="h-full flex flex-col">
      {/* Send message form */}
      <div className="px-4 py-3 border-b border-border/50 bg-bg-card/30">
        <div className="flex items-center gap-2 mb-2">
          <select
            value={sendTo}
            onChange={e => setSendTo(e.target.value)}
            className="bg-bg-panel border border-border rounded-md px-2 py-1.5 text-[11px] text-text flex-shrink-0"
          >
            <option value="">Send to...</option>
            {otherAgents.map(a => (
              <option key={a.id} value={a.id}>{a.displayName}</option>
            ))}
          </select>
          <input
            type="text"
            value={sendContent}
            onChange={e => setSendContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-bg-panel border border-border rounded-md px-3 py-1.5 text-[11px] text-text placeholder:text-text-dim/40"
          />
          <button
            onClick={handleSend}
            disabled={sending || !sendTo || !sendContent.trim()}
            className="px-3 py-1.5 bg-accent/15 text-accent text-[11px] font-semibold rounded-md hover:bg-accent/25 disabled:opacity-40 transition-all cursor-pointer"
          >
            Send
          </button>
          <button
            onClick={handleDeliver}
            disabled={delivering}
            className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold rounded-md hover:bg-emerald-500/25 disabled:opacity-40 transition-all cursor-pointer"
            title="Write INBOX.md to agent's working directory"
          >
            {delivering ? 'Delivering...' : 'Deliver Now'}
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-[10px] text-text-dim text-center py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-[10px] text-text-dim text-center py-8 flex flex-col items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-text-dim/30" />
            No messages
          </div>
        ) : (
          messages.map(msg => {
            const isIncoming = msg.toAgentId === agent.id;
            const badge = typeBadge[msg.messageType] || typeBadge.message;
            const dot = statusDot[msg.status] || statusDot.pending;

            return (
              <div
                key={msg.id}
                className={`px-4 py-3 border-b border-border/20 hover:bg-bg-card/30 transition-colors ${
                  isIncoming ? 'border-l-2 border-l-accent/40' : 'border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span className="text-[11px] font-semibold text-text">
                    {isIncoming ? (msg.fromAgentName || msg.fromAgentId) : `→ ${msg.toAgentName || msg.toAgentId}`}
                  </span>
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: badge.color, backgroundColor: badge.bg }}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[9px] text-text-dim/60 ml-auto">{formatTime(msg.createdAt)}</span>
                </div>
                <p className="text-[11px] text-text-dim leading-relaxed whitespace-pre-wrap ml-3.5">
                  {msg.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
