import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Users, TrendingUp, MoreHorizontal } from 'lucide-react'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/classes', icon: BookOpen, label: 'Classes' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/earnings', icon: TrendingUp, label: 'Earnings' },
  { to: '/settings', icon: MoreHorizontal, label: 'More' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 lg:hidden z-40 safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors min-w-[56px]',
                isActive ? 'text-accent' : 'text-slate-400'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
