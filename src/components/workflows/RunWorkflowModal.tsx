'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, X, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Workflow } from '@/types/workflow'

interface RunWorkflowModalProps {
  workflow: Workflow
  onClose: () => void
  onStarted: (runId: number) => void
}

export function RunWorkflowModal({ workflow, onClose, onStarted }: RunWorkflowModalProps) {
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [handleEscape])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to start workflow')
      }
      const data = await res.json()
      onStarted(data.run.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start workflow')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <Card className="w-full max-w-lg mx-4 py-0 shadow-2xl">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-sm">Run Workflow</CardTitle>
              <Badge
                variant="outline"
                className="gap-1 rounded-full border-accent/20 bg-accent/10 px-2 py-0 text-[11px] font-medium text-accent"
              >
                {workflow.steps.length} steps
              </Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{workflow.name}</p>
        </CardHeader>

        <CardContent className="px-5 pb-4">
          {/* Step preview */}
          <div className="mb-4 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Steps</p>
            {workflow.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-secondary-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-mono">
                  {step.order}
                </span>
                <span>{step.name}</span>
                <span className="text-muted-foreground">({step.agentId})</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what this workflow should process..."
              className="mt-1.5 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none resize-none"
              rows={3}
              autoFocus
            />
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}
        </CardContent>

        <CardFooter className="gap-2 border-t border-border px-5 py-3 justify-end">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-accent px-4 text-xs text-accent-foreground hover:bg-accent/90"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {submitting ? 'Starting...' : 'Run'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
