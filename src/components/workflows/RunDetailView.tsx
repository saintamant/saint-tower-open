'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Pause, Play, Ban, Loader2,
  CheckCircle2, XCircle, Clock, Star, Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WorkflowFlow } from './WorkflowFlow'
import { stepsToFlowLayout, timeAgo } from './workflowUtils'
import type { WorkflowStepTemplate } from '@/types/workflow'

interface RunDetailViewProps {
  runId: number
  onBack: () => void
}

interface RunData {
  id: number
  workflow_id: number
  name: string
  input: string | null
  status: string
  rating: number | null
  rating_notes: string | null
  started_at: string
  completed_at: string | null
  workflow_steps_json: string
}

interface StepData {
  id: number
  step_order: number
  name: string
  agent_id: string
  agent_display_name: string | null
  status: string
  result: string | null
  commits_json: string | null
  started_at: string | null
  completed_at: string | null
}

interface MessageData {
  id: number
  from_agent_id: string
  to_agent_id: string
  from_agent_name: string | null
  to_agent_name: string | null
  content: string
  message_type: string
  created_at: string
}

const statusBadge: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  running: { label: 'Running', className: 'border-amber-500/30 bg-amber-500/10 text-amber-400', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  paused: { label: 'Paused', className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400', icon: <Pause className="h-3 w-3" /> },
  completed: { label: 'Completed', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: 'Failed', className: 'border-red-500/30 bg-red-500/10 text-red-400', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400', icon: <Ban className="h-3 w-3" /> },
}

const stepStatusIcon: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5 text-zinc-500" />,
  in_progress: <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  failed: <XCircle className="h-3.5 w-3.5 text-red-400" />,
}

export function RunDetailView({ runId, onBack }: RunDetailViewProps) {
  const [run, setRun] = useState<RunData | null>(null)
  const [steps, setSteps] = useState<StepData[]>([])
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Rating state
  const [rating, setRating] = useState(0)
  const [ratingNotes, setRatingNotes] = useState('')
  const [ratingSubmitted, setRatingSubmitted] = useState(false)

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflow-runs/${runId}`)
      if (res.ok) {
        const data = await res.json()
        setRun(data.run)
        setSteps(data.steps || [])
        setMessages(data.messages || [])
        if (data.run.rating) {
          setRating(data.run.rating)
          setRatingNotes(data.run.rating_notes || '')
          setRatingSubmitted(true)
        }
      }
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }, [runId])

  useEffect(() => {
    fetchRun()
  }, [fetchRun])

  // Poll while running
  useEffect(() => {
    if (!run || (run.status !== 'running' && run.status !== 'paused')) return
    const interval = setInterval(fetchRun, 5000)
    return () => clearInterval(interval)
  }, [run?.status, fetchRun])

  const handleAction = async (action: string) => {
    setActionLoading(true)
    try {
      await fetch(`/api/workflow-runs/${runId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      await fetchRun()
    } catch {
      // Silent
    } finally {
      setActionLoading(false)
    }
  }

  const handleRate = async () => {
    if (rating === 0) return
    try {
      await fetch(`/api/workflow-runs/${runId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rate', rating, ratingNotes: ratingNotes.trim() || undefined }),
      })
      setRatingSubmitted(true)
    } catch {
      // Silent
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!run) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-sm text-muted-foreground">Run not found</p>
        <button onClick={onBack} className="text-xs text-accent hover:underline cursor-pointer">Back to list</button>
      </main>
    )
  }

  const badge = statusBadge[run.status] || statusBadge.running
  const isTerminal = ['completed', 'failed', 'cancelled'].includes(run.status)

  // Build flow diagram from workflow template steps + execution status
  let templateSteps: WorkflowStepTemplate[] = []
  try {
    templateSteps = JSON.parse(run.workflow_steps_json)
  } catch { /* ignore */ }

  const stepStatuses: Record<number, 'pending' | 'in_progress' | 'completed' | 'failed'> = {}
  steps.forEach(s => {
    stepStatuses[s.step_order] = s.status as 'pending' | 'in_progress' | 'completed' | 'failed'
  })
  const { nodes: flowNodes, edges: flowEdges } = stepsToFlowLayout(templateSteps, stepStatuses)

  const completedCount = steps.filter(s => s.status === 'completed').length

  return (
    <main className="flex flex-1 flex-col overflow-auto">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold truncate text-foreground">{run.name}</h1>
              <Badge variant="outline" className={`gap-1 px-1.5 py-0 text-[10px] ${badge.className}`}>
                {badge.icon}
                {badge.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {completedCount}/{steps.length} steps
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Started {timeAgo(run.started_at)}
              {run.completed_at && ` · Completed ${timeAgo(run.completed_at)}`}
            </p>
          </div>
          {!isTerminal && (
            <div className="flex items-center gap-2 shrink-0">
              {run.status === 'running' ? (
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => handleAction('pause')} disabled={actionLoading}>
                  <Pause className="h-3 w-3" />
                  Pause
                </Button>
              ) : run.status === 'paused' ? (
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => handleAction('resume')} disabled={actionLoading}>
                  <Play className="h-3 w-3" />
                  Resume
                </Button>
              ) : null}
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-red-400 hover:text-red-300" onClick={() => handleAction('cancel')} disabled={actionLoading}>
                <Ban className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 lg:px-8 space-y-6">
        {/* Flow diagram */}
        {flowNodes.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Flow</h2>
            <WorkflowFlow nodes={flowNodes} edges={flowEdges} />
          </section>
        )}

        {/* Steps list */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Steps</h2>
          <Card className="divide-y divide-border py-0">
            {steps.map((step) => (
              <div key={step.id} className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {stepStatusIcon[step.status] || stepStatusIcon.pending}
                  <span className="text-sm font-medium text-foreground">{step.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {step.agent_display_name || step.agent_id}
                  </span>
                  {step.started_at && step.completed_at && (
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {formatDuration(step.started_at, step.completed_at)}
                    </span>
                  )}
                </div>
                {step.result && (
                  <p className="mt-1.5 ml-6 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {step.result}
                  </p>
                )}
                {step.commits_json && (() => {
                  try {
                    const commits = JSON.parse(step.commits_json) as { sha: string; message: string }[]
                    if (commits.length === 0) return null
                    return (
                      <div className="mt-1.5 ml-6 space-y-0.5">
                        {commits.slice(0, 3).map((c) => (
                          <p key={c.sha} className="text-[11px] text-muted-foreground">
                            <span className="font-mono text-accent/70">{c.sha.slice(0, 7)}</span>{' '}
                            {c.message}
                          </p>
                        ))}
                      </div>
                    )
                  } catch { return null }
                })()}
              </div>
            ))}
          </Card>
        </section>

        {/* Messages */}
        {messages.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Messages</h2>
            <Card className="divide-y divide-border py-0">
              {messages.map((msg) => (
                <div key={msg.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Send className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {msg.from_agent_name || msg.from_agent_id}
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-xs font-medium text-foreground">
                      {msg.to_agent_name || msg.to_agent_id}
                    </span>
                    <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[9px] uppercase">
                      {msg.message_type}
                    </Badge>
                    <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-5 line-clamp-4 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
            </Card>
          </section>
        )}

        {/* Rating (only for terminal states, if not already rated) */}
        {isTerminal && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Rating</h2>
            <Card className="py-0">
              <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-xs font-medium">
                  {ratingSubmitted ? 'Thanks for rating!' : 'How did this run go?'}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => !ratingSubmitted && setRating(n)}
                      className={`cursor-pointer transition-colors ${ratingSubmitted ? 'cursor-default' : ''}`}
                      disabled={ratingSubmitted}
                    >
                      <Star
                        className={`h-5 w-5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`}
                      />
                    </button>
                  ))}
                </div>
                {!ratingSubmitted && (
                  <>
                    <textarea
                      value={ratingNotes}
                      onChange={(e) => setRatingNotes(e.target.value)}
                      placeholder="Optional notes..."
                      className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none resize-none"
                      rows={2}
                    />
                    <Button
                      size="sm"
                      className="mt-2 h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={handleRate}
                      disabled={rating === 0}
                    >
                      Submit Rating
                    </Button>
                  </>
                )}
                {ratingSubmitted && ratingNotes && (
                  <p className="text-xs text-muted-foreground">{ratingNotes}</p>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  )
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ${sec % 60}s`
  const hr = Math.floor(min / 60)
  return `${hr}h ${min % 60}m`
}
