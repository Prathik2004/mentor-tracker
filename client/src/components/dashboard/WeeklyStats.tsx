import { TrendingUp, TrendingDown, CalendarRange } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency, percentChange } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { DashboardStats } from '@/types'

export function WeeklyStats({ stats }: { stats: DashboardStats['weekStats'] }) {
  const classChange = percentChange(stats.classes, stats.prevClasses)
  const earningChange = percentChange(stats.earnings, stats.prevEarnings)

  const metrics = [
    { label: 'Classes', value: String(stats.classes), change: classChange },
    { label: 'Students', value: String(stats.students), change: null },
    { label: 'Earned', value: formatCurrency(stats.earnings), change: earningChange },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
          <CalendarRange className="h-4 w-4" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {metrics.map(m => (
            <li key={m.label} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{m.label}</span>
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-slate-900">{m.value}</span>
                {m.change !== null && (
                  <span
                    className={cn(
                      'flex items-center text-xs font-medium',
                      m.change > 0 ? 'text-green-600' : m.change < 0 ? 'text-red-600' : 'text-slate-400'
                    )}
                  >
                    {m.change > 0 && <TrendingUp className="h-3.5 w-3.5" />}
                    {m.change < 0 && <TrendingDown className="h-3.5 w-3.5" />}
                    {Math.abs(m.change)}%
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">vs Last Week</p>
      </CardContent>
    </Card>
  )
}