import { Wallet } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'
import type { DashboardStats } from '@/types'

export function EarningsBreakdown({ stats }: { stats: DashboardStats }) {
  const rows = [
    { label: 'Regular Classes', value: stats.earningsBreakdown.regular ?? 0 },
    { label: 'Demo Classes', value: stats.earningsBreakdown.demo ?? 0 },
    { label: 'Substitute Classes', value: stats.earningsBreakdown.substitute ?? 0 },
    { label: 'PTM', value: stats.earningsBreakdown.ptm ?? 0 },
    { label: 'No-show Payments', value: stats.earningsBreakdown.no_show ?? 0 },
    { label: 'Incentives', value: stats.incentiveEarnings },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {rows.map(row => (
            <li key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-medium text-slate-900">{formatCurrency(row.value)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-slate-200 mt-3 pt-3">
          <span className="text-sm font-semibold text-slate-900">Total</span>
          <span className="text-lg font-bold text-slate-900">{formatCurrency(stats.totalEarned)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
