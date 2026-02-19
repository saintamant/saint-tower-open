'use client'

import {
  Building2,
  Workflow,
  BarChart3,
  RefreshCw,
  Bell,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

interface NavLink {
  view: string;
  label: string;
  icon: typeof Building2;
  subView?: string;
}

const navLinks: NavLink[] = [
  { view: 'office', label: 'Office', icon: Building2 },
  { view: 'workflows', label: 'Workflows', icon: Workflow },
  { view: 'workflows', label: 'Analytics', icon: BarChart3, subView: 'dashboard' },
]

interface StatusItem {
  label: string;
  dotClass: string;
  bgClass: string;
}

const statusDefs: StatusItem[] = [
  { label: 'Active', dotClass: 'bg-emerald-400', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { label: 'Idle', dotClass: 'bg-amber-400', bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { label: 'Offline', dotClass: 'bg-zinc-500', bgClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
]

interface TopNavbarProps {
  activeView: string;
  workflowSubView?: string;
  onViewChange: (view: string) => void;
  onWorkflowNavigate?: (subView: string) => void;
  activeCount: number;
  idleCount: number;
  offlineCount: number;
  onSync: () => void;
}

export function TopNavbar({
  activeView,
  workflowSubView,
  onViewChange,
  onWorkflowNavigate,
  activeCount,
  idleCount,
  offlineCount,
  onSync,
}: TopNavbarProps) {
  const counts = [activeCount, idleCount, offlineCount];

  const isNavActive = (link: NavLink) => {
    if (link.subView) {
      return activeView === link.view && workflowSubView === link.subView;
    }
    if (link.view === 'workflows') {
      return activeView === 'workflows' && workflowSubView !== 'dashboard';
    }
    return activeView === link.view;
  };

  const handleNavClick = (link: NavLink) => {
    if (link.subView) {
      onViewChange(link.view);
      onWorkflowNavigate?.(link.subView);
    } else if (link.view === 'workflows') {
      onViewChange('workflows');
      onWorkflowNavigate?.('list');
    } else {
      onViewChange(link.view);
    }
  };

  return (
    <header className="shrink-0 sticky top-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="grid h-full w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button onClick={() => onViewChange('office')} className="flex items-center gap-2.5 shrink-0 cursor-pointer">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-mono text-xs font-bold text-accent-foreground">
              ST
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
              Saint Tower
            </span>
          </button>
        </div>

        {/* Center: Nav links */}
        <div className="flex items-center justify-center gap-3 min-w-0">
          <Separator orientation="vertical" className="h-5 shrink-0" />
          <nav className="flex items-center gap-3">
            {navLinks.map((link) => {
              const active = isNavActive(link);
              return (
                <Button
                  key={link.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavClick(link)}
                  className={cn(
                    'gap-2 text-muted-foreground hover:text-foreground',
                    active && 'bg-secondary text-foreground'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Right: Status + Actions + Profile */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* Status indicators */}
          <div className="hidden items-center gap-3 md:flex">
            {statusDefs.map((s, i) => (
              <Badge
                key={s.label}
                variant="outline"
                className={cn(
                  'gap-1.5 rounded-full py-0.5 pl-2 pr-2.5 text-[11px] font-medium',
                  s.bgClass
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', s.dotClass)} />
                <span className="font-mono tabular-nums">{counts[i]}</span>
                <span>{s.label}</span>
              </Badge>
            ))}
          </div>

          <Separator orientation="vertical" className="mx-1 hidden h-5 md:block" />

          {/* Action buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={onSync}>
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Sync</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sync agents</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5" />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
                  S
                </div>
                <span className="hidden text-sm font-medium text-foreground md:inline-block">
                  Saint
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">Saint</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
