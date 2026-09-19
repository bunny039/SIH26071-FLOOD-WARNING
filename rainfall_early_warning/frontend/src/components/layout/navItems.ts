import {
  Home,
  LayoutDashboard,
  Calculator,
  CloudRain,
  TriangleAlert,
  HelpCircle,
  Beaker,
  Server
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
}

/** Primary application navigation consumed by sidebar and mobile drawer. */
export const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Home',
    description: 'System landing & status',
    icon: Home,
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'AI early warning monitor',
    icon: LayoutDashboard,
  },
  {
    to: '/predict',
    label: 'Run Prediction',
    description: 'Direct U-Net CNN inference',
    icon: Calculator,
  },
  {
    to: '/weather',
    label: 'Weather Intelligence',
    description: 'Atmospheric input variables',
    icon: CloudRain,
  },
  {
    to: '/alerts',
    label: 'Alert Center',
    description: 'Real-time hazard warnings',
    icon: TriangleAlert,
  },
  {
    to: '/scenario',
    label: 'Scenario Lab',
    description: 'What-if model simulation',
    icon: Beaker,
  },
  {
    to: '/system',
    label: 'System Health',
    description: 'Model & backend telemetry',
    icon: Server,
  },
  {
    to: '/about',
    label: 'How It Works',
    description: 'Research model architecture',
    icon: HelpCircle,
  },
]