import { BookOpen, Users, TrendingUp, Plus, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface FABProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddClass: () => void
  onAddStudent: () => void
  onAddIncentive: () => void
}

export function FAB({ open, onOpenChange, onAddClass, onAddStudent, onAddIncentive }: FABProps) {
  const actions = [
    { icon: BookOpen, label: 'Add Class', onClick: onAddClass, color: 'bg-blue-500' },
    { icon: Users, label: 'Add Student', onClick: onAddStudent, color: 'bg-emerald-500' },
    { icon: TrendingUp, label: 'Add Incentive', onClick: onAddIncentive, color: 'bg-amber-500' },
  ]

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 z-50 lg:hidden flex flex-col items-end gap-3">
        {open && actions.map(({ icon: Icon, label, onClick, color }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <span className="bg-white text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg">
              {label}
            </span>
            <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white shadow-lg', color)}>
              <Icon className="h-5 w-5" />
            </div>
          </button>
        ))}

        <button
          onClick={() => onOpenChange(!open)}
          className={cn(
            'h-14 w-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200',
            open ? 'bg-slate-700 rotate-45' : 'bg-accent'
          )}
        >
          {open ? <X className="h-6 w-6 -rotate-45" /> : <Plus className="h-7 w-7" />}
        </button>
      </div>
    </>
  )
}
