import {
  BrainCircuit,
  CloudRain,
  GitMerge,
  LayoutDashboard,
  TriangleAlert,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
}

/** Primary application navigation. Consumed by the sidebar and mobile drawer. */
export const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Command Center',
    description: 'Situation overview',
    icon: LayoutDashboard,
  },
  {
    to: '/rainfall',
    label: 'Rainfall Intelligence',
    description: 'AI heavy-rainfall forecast',
    icon: CloudRain,
  },
  {
    to: '/flood-risk',
    label: 'Flood Risk',
    description: 'Inundation prediction',
    icon: Waves,
  },
  {
    to: '/data-fusion',
    label: 'Data Fusion',
    description: 'Multi-source engine',
    icon: GitMerge,
  },
  {
    to: '/alerts',
    label: 'Alerts',
    description: 'Early warning center',
    icon: TriangleAlert,
  },
  {
    to: '/ai-insights',
    label: 'AI Insights',
    description: 'How the system thinks',
    icon: BrainCircuit,
  },
]