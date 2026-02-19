"use client"

import { Plus, BarChart3, Search, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

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

interface WorkflowsHeaderProps {
  templateCount: number
  officeIds: string[]
  selectedOffice: string | null
  onOfficeFilter: (officeId: string | null) => void
  onAnalytics?: () => void
  onNewWorkflow?: () => void
}

export function WorkflowsHeader({ templateCount, officeIds, selectedOffice, onOfficeFilter, onAnalytics, onNewWorkflow }: WorkflowsHeaderProps) {
  return (
    <div className="border-b border-border px-6 py-5 lg:px-8">
      {/* Title row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Workflows
          </h1>
          <Badge
            variant="outline"
            className="rounded-full border-border px-2 py-0 text-[11px] font-mono text-muted-foreground"
          >
            {templateCount} templates
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={onAnalytics}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics
              </Button>
            </TooltipTrigger>
            <TooltipContent>View workflow analytics</TooltipContent>
          </Tooltip>

          <Button
            size="sm"
            className="gap-1.5 bg-accent text-xs font-semibold text-accent-foreground hover:bg-accent/90"
            onClick={onNewWorkflow}
          >
            <Plus className="h-3.5 w-3.5" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Office filter pills */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onOfficeFilter(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              selectedOffice === null
                ? 'bg-foreground text-background'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            All
          </button>
          {officeIds.map(id => {
            const config = officeConfig[id] || { name: id, color: '#6b7280' }
            const isActive = selectedOffice === id
            return (
              <button
                key={id}
                onClick={() => onOfficeFilter(isActive ? null : id)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-background'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
                style={isActive ? { backgroundColor: config.color } : undefined}
              >
                {config.name}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="sr-only">Search workflows</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-0.5 h-4" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="sr-only">Grid view</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid view</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <List className="h-3.5 w-3.5" />
                <span className="sr-only">List view</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>List view</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
