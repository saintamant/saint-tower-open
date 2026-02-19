'use client'

import { useState, useEffect } from 'react'
import { Zap, ArrowRight, CheckCircle2, XCircle, Loader2, Pause, Ban } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from './workflowUtils'

interface RunItem {
  id: number
  name: string
  status: string
  totalSteps: number
  completedSteps: number
  currentStepName?: string
  started_at: string
}

interface RecentActivityProps {
  onViewRun?: (runId: number) => void
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  running: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Running', className: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
  paused: { icon: <Pause className="h-3 w-3" />, label: 'Paused', className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400' },
  completed: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Completed', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  failed: { icon: <XCircle className="h-3 w-3" />, label: 'Failed', className: 'border-red-500/30 bg-red-500/10 text-red-400' },
  cancelled: { icon: <Ban className="h-3 w-3" />, label: 'Cancelled', className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400' },
}

export function RecentActivity({ onViewRun }: RecentActivityProps) {
  const [runs, setRuns] = useState<RunItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRuns = async () => {
    try {
      const res = await fetch('/api/workflow-runs?limit=5')
      if (res.ok) {
        const data = await res.json()
        setRuns(data.runs || [])
      }
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRuns()
    const interval = setInterval(fetchRuns, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className="border-dashed py-0">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (runs.length === 0) {
    return (
      <Card className="border-dashed py-0">
        <CardContent className="flex flex-col items-center justify-center py-14">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No runs yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Run a template to see activity here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="divide-y divide-border py-0">
      {runs.map((run) => {
        const cfg = statusConfig[run.status] || statusConfig.running
        return (
          <button
            key={run.id}
            onClick={() => onViewRun?.(run.id)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{run.name}</span>
                <Badge variant="outline" className={`gap-1 px-1.5 py-0 text-[10px] ${cfg.className}`}>
                  {cfg.icon}
                  {cfg.label}
                </Badge>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{run.completedSteps}/{run.totalSteps} steps</span>
                {run.currentStepName && (
                  <>
                    <span className="text-border">·</span>
                    <span className="truncate">{run.currentStepName}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-muted-foreground">{timeAgo(run.started_at)}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </div>
          </button>
        )
      })}
    </Card>
  )
}
