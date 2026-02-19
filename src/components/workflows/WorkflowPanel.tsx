'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { WorkflowCard } from './WorkflowCard'
import { RecentActivity } from './RecentActivity'
import { WorkflowsHeader } from './WorkflowsHeader'
import { RunWorkflowModal } from './RunWorkflowModal'
import { RunDetailView } from './RunDetailView'
import { DashboardView } from './DashboardView'
import { stepsToFlowLayout } from './workflowUtils'
import type { Workflow, WorkflowStepTemplate } from '@/types/workflow'

export type WorkflowSubView = 'list' | 'builder' | 'run-detail' | 'dashboard'

interface Props {
  subView: WorkflowSubView
  selectedRunId?: number | null
  selectedWorkflowId?: number | null
  onNavigate: (view: WorkflowSubView, opts?: { runId?: number; workflowId?: number }) => void
  statusPills?: React.ReactNode
  showHeader?: boolean
}

interface WorkflowWithLayout extends Workflow {
  nodes: { id: string; label: string; x: number; y: number }[]
  edges: { from: string; to: string }[]
  lastRun?: string
}

const officeConfig: Record<string, { name: string; color: string }> = {
  'sa-core':    { name: 'SA Core',      color: '#10b981' },
  'lab':        { name: 'Lab',          color: '#ec4899' },
  'project-a':  { name: 'Project A',    color: '#eab308' },
  'project-b':  { name: 'Project B',    color: '#a78bfa' },
  'project-c':  { name: 'Project C',    color: '#22c55e' },
  'project-d':  { name: 'Project D',    color: '#ef4444' },
  'project-e':  { name: 'Project E',    color: '#06b6d4' },
  'library':    { name: 'Library',       color: '#06b6d4' },
  'all':        { name: 'Cross-Office', color: '#9ca3af' },
}

const officeOrder = ['sa-core', 'project-e', 'project-c', 'project-b', 'project-a', 'project-d', 'lab', 'library', 'all']

export default function WorkflowPanel({ subView, selectedRunId, onNavigate, showHeader = true }: Props) {
  const [workflows, setWorkflows] = useState<WorkflowWithLayout[]>([])
  const [loading, setLoading] = useState(true)
  const [modalWorkflow, setModalWorkflow] = useState<Workflow | null>(null)
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null)

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows')
      if (res.ok) {
        const data = await res.json()
        const wfs = (data.workflows || []).map((wf: { id: number; name: string; description?: string; officeId?: string; cronExpression?: string; scheduleEnabled?: boolean; steps: WorkflowStepTemplate[]; lastRun?: string }) => {
          const { nodes, edges } = stepsToFlowLayout(wf.steps)
          return { ...wf, nodes, edges }
        })
        setWorkflows(wfs)
      }
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  // Compute unique office IDs present in workflows
  const officeIds = useMemo(() => {
    const ids = new Set<string>()
    for (const wf of workflows) {
      if (wf.officeId) ids.add(wf.officeId)
    }
    return officeOrder.filter(id => ids.has(id))
  }, [workflows])

  // Filter workflows by selected office
  const filteredWorkflows = useMemo(() => {
    if (!selectedOffice) return workflows
    return workflows.filter(w => w.officeId === selectedOffice)
  }, [workflows, selectedOffice])

  // Group by office for display when no filter is active
  const groupedWorkflows = useMemo(() => {
    if (selectedOffice) return null // flat list when filtered
    const groups = new Map<string, WorkflowWithLayout[]>()
    for (const wf of workflows) {
      const oid = wf.officeId || 'sa-core'
      if (!groups.has(oid)) groups.set(oid, [])
      groups.get(oid)!.push(wf)
    }
    return officeOrder
      .filter(id => groups.has(id))
      .map(id => ({ officeId: id, workflows: groups.get(id)! }))
  }, [workflows, selectedOffice])

  const handleDelete = async (wfId: number) => {
    if (!confirm('Delete this workflow template?')) return
    try {
      const res = await fetch(`/api/workflows/${wfId}`, { method: 'DELETE' })
      if (res.ok) {
        setWorkflows(prev => prev.filter(w => w.id !== wfId))
      }
    } catch {
      // Silent
    }
  }

  const handleRunStarted = (runId: number) => {
    setModalWorkflow(null)
    onNavigate('run-detail', { runId })
  }

  // Sub-view routing
  if (subView === 'run-detail' && selectedRunId) {
    return <RunDetailView runId={selectedRunId} onBack={() => onNavigate('list')} />
  }

  if (subView === 'dashboard') {
    return <DashboardView onBack={() => onNavigate('list')} />
  }

  if (subView === 'builder') {
    return (
      <main className="flex flex-1 flex-col items-center justify-center">
        <p className="text-sm text-muted-foreground">Workflow Builder — coming soon</p>
        <button onClick={() => onNavigate('list')} className="mt-3 text-xs text-accent hover:underline cursor-pointer">
          Back to list
        </button>
      </main>
    )
  }

  const renderWorkflowCard = (wf: WorkflowWithLayout) => {
    const config = officeConfig[wf.officeId || 'sa-core']
    return (
      <WorkflowCard
        key={wf.id}
        title={wf.name}
        description={wf.description || ''}
        stepCount={wf.steps.length}
        nodes={wf.nodes}
        edges={wf.edges}
        lastRun={wf.lastRun}
        officeName={config?.name}
        officeColor={config?.color}
        cronExpression={wf.cronExpression}
        onRun={() => setModalWorkflow(wf)}
        onEdit={() => onNavigate('builder', { workflowId: wf.id })}
        onDelete={() => handleDelete(wf.id)}
      />
    )
  }

  // List view (default)
  return (
    <main className="flex flex-1 flex-col overflow-auto">
      {showHeader && (
        <WorkflowsHeader
          templateCount={workflows.length}
          officeIds={officeIds}
          selectedOffice={selectedOffice}
          onOfficeFilter={setSelectedOffice}
          onAnalytics={() => onNavigate('dashboard')}
          onNewWorkflow={() => onNavigate('builder')}
        />
      )}

      <div className="flex-1 px-6 pb-8 lg:px-8">
        {/* Templates */}
        <section>
          {loading ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Loading workflows...</p>
          ) : selectedOffice ? (
            // Filtered: flat grid
            <>
              <div className="mb-4 mt-6 flex items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {officeConfig[selectedOffice]?.name || selectedOffice} Workflows
                </h2>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredWorkflows.map(renderWorkflowCard)}
              </div>
            </>
          ) : (
            // No filter: grouped by office
            groupedWorkflows?.map(group => {
              const config = officeConfig[group.officeId] || { name: group.officeId, color: '#6b7280' }
              return (
                <div key={group.officeId}>
                  <div className="mb-4 mt-6 flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {config.name}
                    </h2>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {group.workflows.map(renderWorkflowCard)}
                  </div>
                </div>
              )
            })
          )}
        </section>

        {/* Recent Activity */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Activity
            </h2>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <RecentActivity onViewRun={(runId) => onNavigate('run-detail', { runId })} />
        </section>
      </div>

      {/* Run modal */}
      {modalWorkflow && (
        <RunWorkflowModal
          workflow={modalWorkflow}
          onClose={() => setModalWorkflow(null)}
          onStarted={handleRunStarted}
        />
      )}
    </main>
  )
}
