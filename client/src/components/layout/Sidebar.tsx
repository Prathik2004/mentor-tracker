import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  TrendingUp,
  Settings,
  FileText,
  Plus,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/classes', icon: BookOpen, label: 'Classes' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/earnings', icon: TrendingUp, label: 'Earnings' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  onAddClass: () => void
  onAddStudent: () => void
  onAddIncentive: () => void
}

export function Sidebar({ onAddClass, onAddStudent, onAddIncentive }: SidebarProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-50">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-lg">MentorTrack</span>
      </div>

      <div className="p-4">
        <button
          onClick={onAddClass}
          className="w-full flex items-center justify-center gap-2 h-10 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Class
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-slate-600 hover:bg-slate-50'
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-2">
        <button
          onClick={onAddStudent}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Users className="h-4 w-4" />
          Add Student
        </button>
        <button
          onClick={onAddIncentive}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          Add Incentive
        </button>
      </div>
    </aside>
  )
}
