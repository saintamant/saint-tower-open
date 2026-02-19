import { WorkflowStepTemplate } from '@/types/workflow';

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface FlowEdge {
  from: string;
  to: string;
}

export function stepsToFlowLayout(
  steps: WorkflowStepTemplate[],
  stepStatuses?: Record<number, 'pending' | 'in_progress' | 'completed' | 'failed'>
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  // Calculate topological depth for each step
  const depthMap = new Map<number, number>();

  function getDepth(order: number): number {
    if (depthMap.has(order)) return depthMap.get(order)!;
    const step = steps.find(s => s.order === order);
    if (!step || !step.dependsOn || step.dependsOn.length === 0) {
      depthMap.set(order, 0);
      return 0;
    }
    const maxParentDepth = Math.max(...step.dependsOn.map(d => getDepth(d)));
    const depth = maxParentDepth + 1;
    depthMap.set(order, depth);
    return depth;
  }

  steps.forEach(s => getDepth(s.order));

  // Group steps by column (depth)
  const columns = new Map<number, WorkflowStepTemplate[]>();
  steps.forEach(s => {
    const depth = depthMap.get(s.order) || 0;
    if (!columns.has(depth)) columns.set(depth, []);
    columns.get(depth)!.push(s);
  });

  const spacingX = 170;
  const spacingY = 46;

  const nodes: FlowNode[] = [];
  columns.forEach((colSteps, col) => {
    const totalHeight = (colSteps.length - 1) * spacingY;
    const startY = Math.max(0, (80 - totalHeight) / 2); // center vertically in ~80px space

    colSteps.forEach((step, i) => {
      nodes.push({
        id: String(step.order),
        label: step.name,
        x: col * spacingX,
        y: startY + i * spacingY,
        status: stepStatuses?.[step.order],
      });
    });
  });

  // Generate edges from dependsOn
  const edges: FlowEdge[] = [];
  steps.forEach(step => {
    if (step.dependsOn) {
      step.dependsOn.forEach(dep => {
        edges.push({ from: String(dep), to: String(step.order) });
      });
    }
  });

  return { nodes, edges };
}

export function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}
