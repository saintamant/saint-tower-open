'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, Activity, CheckCircle2, XCircle, Clock, Star, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { WorkflowStats } from '@/types/workflow'

interface DashboardViewProps {
  onBack: () => void
}

export function DashboardView({ onBack }: DashboardViewProps) {
  const [stats, setStats] = useState<WorkflowStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/workflow-stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // Silent
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!stats) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-sm text-muted-foreground">Failed to load stats</p>
        <button onClick={onBack} className="text-xs text-accent hover:underline cursor-pointer">Back</button>
      </main>
    )
  }

  const { overview, perWorkflow, agentPerformance } = stats

  return (
    <main className="flex flex-1 flex-col overflow-auto">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-semibold text-foreground">Workflow Analytics</h1>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 lg:px-8 space-y-6">
        {/* Overview cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricCard
            icon={<Activity className="h-4 w-4 text-accent" />}
            label="Total Runs"
            value={String(overview.totalRuns)}
          />
          <MetricCard
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            label="Success Rate"
            value={overview.totalRuns > 0 ? `${overview.successRate}%` : '-'}
          />
          <MetricCard
            icon={<Zap className="h-4 w-4 text-amber-400" />}
            label="Active"
            value={String(overview.activeRuns)}
          />
          <MetricCard
            icon={<Clock className="h-4 w-4 text-blue-400" />}
            label="Avg Duration"
            value={overview.avgDurationSeconds != null ? formatSeconds(overview.avgDurationSeconds) : '-'}
          />
          <MetricCard
            icon={<Star className="h-4 w-4 text-amber-400" />}
            label="Avg Rating"
            value={overview.avgRating != null ? `${overview.avgRating}/5` : '-'}
          />
        </div>

        {/* Per-workflow table */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Per Workflow</h2>
          <Card className="py-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Workflow</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Runs</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Completed</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Failed</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Avg Duration</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {perWorkflow.map((w) => (
                    <tr key={w.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{w.name}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{w.total_runs}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-400">{w.completed}</td>
                      <td className="px-4 py-2.5 text-right text-red-400">{w.failed}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        {w.avg_duration_seconds != null ? formatSeconds(w.avg_duration_seconds) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        {w.avg_rating != null ? `${Math.round(w.avg_rating * 10) / 10}/5` : '-'}
                      </td>
                    </tr>
                  ))}
                  {perWorkflow.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No data yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Agent performance table */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Agent Performance</h2>
          <Card className="py-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Agent</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Total Steps</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Completed</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Avg Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agentPerformance.map((a) => (
                    <tr key={a.agent_id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{a.display_name}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{a.total_steps}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-400">{a.completed_steps}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        {a.avg_step_duration_seconds != null ? formatSeconds(a.avg_step_duration_seconds) : '-'}
                      </td>
                    </tr>
                  ))}
                  {agentPerformance.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No data yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="py-0">
      <CardHeader className="px-4 pt-3 pb-1 flex-row items-center gap-2">
        {icon}
        <CardTitle className="text-[11px] font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function formatSeconds(sec: number): string {
  sec = Math.round(sec)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  return `${hr}h ${min % 60}m`
}
