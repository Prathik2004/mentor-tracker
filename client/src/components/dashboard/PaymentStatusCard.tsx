import { CalendarClock, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatMonth, formatDate, getPaymentWindow } from '@/utils/format'
import { PAYMENT_STATUS_LABELS } from '@/types'
import type { DashboardStats, PaymentStatus } from '@/types'
import { cn } from '@/utils/cn'

function statusBadgeVariant(status: PaymentStatus) {
  switch (status) {
    case 'received': return 'success'
    case 'partially_received': return 'warning'
    case 'disputed': return 'destructive'
    default: return 'warning'
  }
}

function statusIcon(status: PaymentStatus) {
  return status === 'received' ? CheckCircle2 : Clock
}

export function PaymentStatusCard({ stats, month }: { stats: DashboardStats; month: string }) {
  const payment = stats.paymentInfo
  const status: PaymentStatus = payment?.status ?? 'pending'
  const Icon = statusIcon(status)

  const expectedWindow = payment
    ? `${formatDate(payment.expectedWindowStart)} – ${formatDate(payment.expectedWindowEnd)}`
    : getPaymentWindow(month, 10, 15)

  const received = payment?.receivedAmount ?? null
  const difference = received !== null ? stats.totalEarned - received : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            {formatMonth(month)} Earnings
          </CardTitle>
          <Badge variant={statusBadgeVariant(status)}>
            <Icon className="h-3 w-3 mr-1 inline" />
            {PAYMENT_STATUS_LABELS[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold text-slate-900">{formatCurrency(stats.totalEarned)}</p>

        <div className="text-sm text-slate-500">
          <p className="font-medium text-slate-700">Expected Payment</p>
          <p>{expectedWindow}</p>
        </div>

        {received !== null && (
          <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Expected</span>
              <span className="font-medium">{formatCurrency(stats.totalEarned)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Received</span>
              <span className="font-medium">{formatCurrency(received)}</span>
            </div>
            {payment?.receivedDate && (
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium">{formatDate(payment.receivedDate)}</span>
              </div>
            )}
            {difference !== null && difference !== 0 && (
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Difference</span>
                <span className={cn('font-semibold', difference < 0 ? 'text-red-600' : 'text-green-600')}>
                  {difference < 0 ? '-' : '+'}{formatCurrency(Math.abs(difference))}
                </span>
              </div>
            )}
          </div>
        )}

        {status !== 'received' && (
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarClock className="h-3.5 w-3.5" />
            Payment for this month's classes arrives the following month.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
