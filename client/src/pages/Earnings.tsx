import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'
import { paymentsApi } from '@/api/payments'
import { incentivesApi } from '@/api/incentives'
import type { PaymentStatus } from '@/types'
import { PAYMENT_STATUS_LABELS } from '@/types'
import { getCurrentMonth, formatMonth, formatCurrency, formatDate, formatMonthShort } from '@/utils/format'
import { MonthPicker } from '@/components/ui/month-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { ChevronRight, Receipt, ShoppingBag } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function Earnings() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [markMonth, setMarkMonth] = useState<string | null>(null)
  const [receivedAmount, setReceivedAmount] = useState('')
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [payStatus, setPayStatus] = useState<PaymentStatus>('received')
  const [payNotes, setPayNotes] = useState('')

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', month],
    queryFn: () => dashboardApi.getStats(month),
  })

  const { data: history } = useQuery({
    queryKey: ['monthly-history'],
    queryFn: () => dashboardApi.getMonthlyHistory(),
  })

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.getAll(),
  })

  const { data: incentives } = useQuery({
    queryKey: ['incentives', month],
    queryFn: () => incentivesApi.getAll(month),
  })

  const updatePayment = useMutation({
    mutationFn: () =>
      paymentsApi.update(markMonth!, {
        receivedAmount: Number(receivedAmount),
        receivedDate,
        status: payStatus,
        notes: payNotes || undefined,
      }),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast(`Payment marked as ${PAYMENT_STATUS_LABELS[p.status]}`, 'success')
      setMarkMonth(null)
    },
    onError: () => toast('Could not update payment', 'error'),
  })

  function openPaymentDialog(mon: string) {
    setMarkMonth(mon)
    const pay = payments?.find(p => p.earningMonth === mon)
    setReceivedAmount(pay?.receivedAmount ? String(pay.receivedAmount) : '')
    setPayStatus(pay?.status ?? 'received')
    setPayNotes(pay?.notes ?? '')
  }

  const chartData = (history || [])
    .map(d => ({ name: formatMonthShort(d.month), Earnings: d.totalEarned }))
    .reverse()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )
  }

  const breakRows = [
    { label: 'Regular Classes', value: stats?.earningsBreakdown.regular ?? 0 },
    { label: 'Demo Classes', value: stats?.earningsBreakdown.demo ?? 0 },
    { label: 'Substitute Classes', value: stats?.earningsBreakdown.substitute ?? 0 },
    { label: 'PTM', value: stats?.earningsBreakdown.ptm ?? 0 },
    { label: 'No-show', value: stats?.earningsBreakdown.no_show ?? 0 },
  ]

  const selectedPayment = markMonth ? payments?.find(p => p.earningMonth === markMonth) : null

  const totalEarned = stats?.totalEarned ?? 0
  const tdsDeduction = Math.round(totalEarned * 0.1)
  const netEarned = totalEarned - tdsDeduction

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Summary card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total Earned · {formatMonth(month)}</span>
            <Badge variant={stats?.paymentInfo?.status === 'received' ? 'success' : 'warning'} className="border-0">
              {stats?.paymentInfo ? PAYMENT_STATUS_LABELS[stats.paymentInfo.status] : 'Pending'}
            </Badge>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(netEarned)}</p>

          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            {breakRows.map(row => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{row.label}</span>
                <span className="font-medium">{formatCurrency(row.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Incentives</span>
              <span className="font-medium text-amber-600">{formatCurrency(stats?.incentiveEarnings ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-1.5">
              <span className="font-semibold text-slate-900">Gross Earnings</span>
              <span className="font-bold text-slate-900">{formatCurrency(totalEarned)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">TDS (10%)</span>
              <span className="font-medium text-red-600">−{formatCurrency(tdsDeduction)}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-1.5">
              <span className="font-semibold text-slate-900">Net Payable</span>
              <span className="font-bold text-green-600">{formatCurrency(netEarned)}</span>
            </div>
          </div>

          {stats?.paymentInfo && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Expected</span>
                <span className="font-medium">{formatCurrency(stats.paymentInfo.expectedAmount)}</span>
              </div>
              {stats.paymentInfo.receivedAmount !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Received</span>
                  <span className="font-medium text-green-600">{formatCurrency(stats.paymentInfo.receivedAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Expected date</span>
                <span className="font-medium">
                  {formatDate(stats.paymentInfo.expectedWindowStart)} – {formatDate(stats.paymentInfo.expectedWindowEnd)}
                </span>
              </div>
            </div>
          )}

          <Button onClick={() => openPaymentDialog(month)} className="w-full" variant="outline">
            <Receipt className="h-4 w-4 mr-1" /> Mark Payment
          </Button>
        </CardContent>
      </Card>

      {/* Incentives */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Incentives · {formatMonth(month)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!incentives || incentives.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No incentives this month</p>
          ) : (
            <ul className="space-y-2">
              {incentives.map(inc => (
                <li key={inc._id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{inc.type}</p>
                    {inc.description && <p className="text-xs text-slate-400 truncate">{inc.description}</p>}
                    <p className="text-xs text-slate-400">{formatDate(inc.date)}</p>
                  </div>
                  <span className="font-semibold text-green-600 shrink-0">+{formatCurrency(inc.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500">Monthly History</CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No earnings history yet</p>
          ) : (
            <ul className="space-y-1.5">
              {history.slice(0, 12).map(h => {
                const pay = payments?.find(p => p.earningMonth === h.month)
                return (
                  <button
                    key={h.month}
                    onClick={() => setMonth(h.month)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-slate-800 truncate">{formatMonth(h.month)}</span>
                      <span className="text-xs text-slate-400 shrink-0">{h.classCount} classes</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {pay && (
                        <Badge variant={pay.status === 'received' ? 'success' : 'warning'} className="border-0">
                          {PAYMENT_STATUS_LABELS[pay.status]}
                        </Badge>
                      )}
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(h.totalEarned)}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </button>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Earnings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={58} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="Earnings" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark payment dialog */}
      <Dialog open={!!markMonth} onOpenChange={(o) => !o && setMarkMonth(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Payment · {markMonth ? formatMonth(markMonth) : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm">
                <span className="text-slate-500">Expected</span>
                <span className="font-semibold">{formatCurrency(selectedPayment.expectedAmount)}</span>
              </div>
            )}
            <div>
              <Label>Status</Label>
              <Select value={payStatus} onValueChange={(v) => setPayStatus(v as PaymentStatus)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="partially_received">Partially Received</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pay-amount">Received Amount (₹)</Label>
              <Input
                id="pay-amount"
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="Enter amount received"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="pay-date">Received Date</Label>
              <Input id="pay-date" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="pay-notes">Notes</Label>
              <Textarea id="pay-notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional note" className="mt-1.5" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setMarkMonth(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (receivedAmount === '' || Number(receivedAmount) < 0) {
                  toast('Enter a valid received amount', 'error')
                  return
                }
                updatePayment.mutate()
              }}
              disabled={updatePayment.isPending}
            >
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}