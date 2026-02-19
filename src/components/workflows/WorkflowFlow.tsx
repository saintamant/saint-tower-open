"use client"

import { cn } from "@/lib/utils"

interface FlowNode {
  id: string
  label: string
  x: number
  y: number
  status?: 'pending' | 'in_progress' | 'completed' | 'failed'
}

interface FlowEdge {
  from: string
  to: string
}

interface WorkflowFlowProps {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

const statusDotClass: Record<string, string> = {
  pending: 'bg-zinc-500',
  in_progress: 'bg-amber-400 animate-pulse',
  completed: 'bg-emerald-400',
  failed: 'bg-red-400',
}

export function WorkflowFlow({ nodes, edges }: WorkflowFlowProps) {
  const nodeWidth = 130
  const nodeHeight = 32
  const padX = 20
  const padY = 16
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  const maxX = Math.max(...nodes.map((n) => n.x)) + nodeWidth + padX * 2
  const maxY = Math.max(...nodes.map((n) => n.y)) + nodeHeight + padY * 2

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border/50 bg-background/60"
      style={{ height: Math.max(maxY, 100) }}
    >
      {/* Subtle grid pattern */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Edges */}
      <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }}>
        <defs>
          <marker
            id="flow-arrow"
            markerWidth="6"
            markerHeight="5"
            refX="6"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 6 2.5, 0 5" className="fill-accent/60" />
          </marker>
        </defs>
        {edges.map((edge, i) => {
          const from = nodeMap.get(edge.from)
          const to = nodeMap.get(edge.to)
          if (!from || !to) return null
          const x1 = from.x + nodeWidth + padX
          const y1 = from.y + nodeHeight / 2 + padY
          const x2 = to.x + padX
          const y2 = to.y + nodeHeight / 2 + padY
          const cx1 = x1 + (x2 - x1) * 0.4
          const cx2 = x1 + (x2 - x1) * 0.6
          return (
            <g key={i}>
              <path
                d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                fill="none"
                className="stroke-border"
                strokeWidth="1.5"
                markerEnd="url(#flow-arrow)"
              />
            </g>
          )
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className={cn(
            "absolute flex items-center gap-2 rounded-md border border-border/80 bg-secondary/80 px-2.5 py-1.5",
            "text-xs font-medium text-secondary-foreground",
            "backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-secondary"
          )}
          style={{
            left: node.x + padX,
            top: node.y + padY,
            width: nodeWidth,
            height: nodeHeight,
          }}
        >
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", node.status ? statusDotClass[node.status] : "bg-accent/80")} />
          <span className="truncate">{node.label}</span>
        </div>
      ))}
    </div>
  )
}
