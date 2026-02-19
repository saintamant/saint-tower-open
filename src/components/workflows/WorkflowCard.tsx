"use client"

import { Play, Pencil, MoreHorizontal, Clock } from "lucide-react"
import { WorkflowFlow } from "./WorkflowFlow"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

interface FlowNode {
  id: string
  label: string
  x: number
  y: number
}

interface FlowEdge {
  from: string
  to: string
}

interface WorkflowCardProps {
  title: string
  description: string
  stepCount: number
  nodes: FlowNode[]
  edges: FlowEdge[]
  lastRun?: string
  officeName?: string
  officeColor?: string
  cronExpression?: string
  onRun?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function WorkflowCard({
  title,
  description,
  stepCount,
  nodes,
  edges,
  lastRun,
  officeName,
  officeColor,
  cronExpression,
  onRun,
  onEdit,
  onDelete,
}: WorkflowCardProps) {
  return (
    <Card className="group gap-0 overflow-hidden py-0 transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
      <CardHeader className="gap-1.5 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Badge
            variant="outline"
            className="gap-1 rounded-full border-accent/20 bg-accent/10 px-2 py-0 text-[11px] font-medium text-accent"
          >
            {stepCount} steps
          </Badge>
          {officeName && officeColor && (
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0 text-[11px] font-medium"
              style={{ borderColor: officeColor + '40', color: officeColor }}
            >
              {officeName}
            </Badge>
          )}
          {cronExpression && (
            <Badge
              variant="outline"
              className="gap-1 rounded-full border-blue-500/20 bg-blue-500/10 px-2 py-0 text-[11px] font-medium text-blue-400"
            >
              <Clock className="h-2.5 w-2.5" />
              cron
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs leading-relaxed">
          {description}
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="px-5 pb-3">
        <WorkflowFlow nodes={nodes} edges={edges} />
      </CardContent>

      <CardFooter className="gap-2 border-t border-border px-5 py-3">
        <div className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{lastRun ? `Last run ${lastRun}` : "Never run"}</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit workflow template</TooltipContent>
        </Tooltip>

        <Button size="sm" className="h-7 gap-1.5 bg-accent px-3 text-xs text-accent-foreground hover:bg-accent/90" onClick={onRun}>
          <Play className="h-3 w-3" />
          Run
        </Button>
      </CardFooter>
    </Card>
  )
}
