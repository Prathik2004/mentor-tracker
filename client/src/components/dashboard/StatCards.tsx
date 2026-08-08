import { IndianRupee, BookOpen, Users, Calculator } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'
import type { DashboardStats } from '@/types'

export function StatCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      title: 'Total Earned',
      value: formatCurrency(stats.totalEarned),
      icon: IndianRupee,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Classes',
      value: String(stats.totalClasses),
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Students',
      value: String(stats.uniqueStudents),
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Avg / Class',
      value: formatCurrency(stats.avgPerClass),
      icon: Calculator,
      color: 'bg-amber-100 text-amber-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ title, value, icon: Icon, color }) => (
        <Card key={title} className="p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xl lg:text-2xl font-bold text-slate-900 truncate">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{title}</p>
            </div>
            <div className={`rounded-full p-2 ${color} shrink-0`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
