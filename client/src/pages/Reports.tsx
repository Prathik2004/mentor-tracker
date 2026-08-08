import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { studentsApi } from '@/api/students'
import { getCurrentMonth, formatMonth, formatCurrency, formatMonthShort } from '@/utils/format'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { PAYMENT_STATUS_LABELS } from '@/types'
import type { ClassType, PaymentStatus } from '@/types'
import { CLASS_TYPE_LABELS } from '@/types'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText, User, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function TypeBreakdown({ classes }: { classes: any[] }) {
  const types: ClassType[] = ['regular', 'demo', 'substitute', 'ptm']
  const counts = types.map(t => ({
    label: CLASS_TYPE_LABELS[t],
    count: classes.filter(c => c.classType === t).length,
    earnings: classes.filter(c => c.classType === t).reduce((s, c) => s + c.paymentAmount, 0),
  }))
  return (
    <div className="space-y-1.5">
      {counts.map(c => (
        <div key={c.label} className="flex items-center justify-between text-sm">
          <span className="text-slate-600">{c.label}</span>
          <span className="font-medium">{c.count} · {formatCurrency(c.earnings)}</span>
        </div>
      ))}
    </div>
  )
}

export function ReportsPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentMonth().split('-')[0])
  const [studentId, setStudentId] = useState('')

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ['report-monthly', month],
    queryFn: () => reportsApi.getMonthly(month),
  })

  const { data: yearly, isLoading: yearlyLoading } = useQuery({
    queryKey: ['report-yearly', year],
    queryFn: () => reportsApi.getYearly(year),
  })

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.getAll(),
  })

  const { data: studentReport, isLoading: studentLoading } = useQuery({
    queryKey: ['report-student', studentId],
    queryFn: () => reportsApi.getStudent(studentId),
    enabled: !!studentId,
  })

  const yearlyChart = (yearly?.monthlyBreakdown || [])
    .map((m: any) => ({ name: formatMonthShort(m.month), Earnings: m.totalEarnings }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>

      <Tabs defaultValue="monthly">
        <TabsList className="w-full">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        {/* Monthly report */}
        <TabsContent value="monthly">
          <div className="mb-3">
            <Label>Month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1.5 max-w-[240px]" />
          </div>

          {monthlyLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : !monthly ? (
            <EmptyState icon={FileText} title="No report" description="Unable to load the monthly report." />
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{formatMonth(month)}</span>
                    {monthly.payment && (
                      <Badge variant={monthly.payment.status === 'received' ? 'success' : 'warning'} className="border-0">
                        {PAYMENT_STATUS_LABELS[monthly.payment.status as PaymentStatus]}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-2xl font-bold">{monthly.summary.totalClasses}</p>
                      <p className="text-xs text-slate-500">Total Classes</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-2xl font-bold">{monthly.summary.completedCount}</p>
                      <p className="text-xs text-slate-500">Completed</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-2xl font-bold">{monthly.summary.noShowCount}</p>
                      <p className="text-xs text-slate-500">No-shows</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(monthly.summary.totalEarnings)}</p>
                      <p className="text-xs text-slate-500">Total Earnings</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-600">Class Earnings</span><span className="font-medium">{formatCurrency(monthly.summary.totalEarnings - monthly.summary.incentiveEarnings)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Incentives</span><span className="font-medium text-amber-600">{formatCurrency(monthly.summary.incentiveEarnings)}</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Class Type Breakdown</CardTitle></CardHeader>
                <CardContent><TypeBreakdown classes={monthly.classes} /></CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">By Student</CardTitle></CardHeader>
                <CardContent>
                  {monthly.studentBreakdown.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">No student data</p>
                  ) : (
                    <ul className="space-y-2">
                      {monthly.studentBreakdown.map((s: any) => (
                        <li key={s._id} className="flex items-center justify-between text-sm">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{s.studentName}</p>
                            {s.course && <p className="text-xs text-slate-400 truncate">{s.course}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold">{formatCurrency(s.earnings)}</p>
                            <p className="text-xs text-slate-400">{s.classCount} classes · {s.completedCount} completed</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Student report */}
        <TabsContent value="student">
          <div className="mb-3">
            <Label>Student</Label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1.5 w-full max-w-xs h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
            >
              <option value="">Select a student</option>
              {students?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          {!studentId ? (
            <EmptyState icon={User} title="Select a student" description="Choose a student to see their report." />
          ) : studentLoading ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : studentReport ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-lg font-bold">{studentReport.student.name}</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-slate-50 p-3"><p className="text-lg font-bold">{studentReport.stats.totalClasses}</p><p className="text-xs text-slate-500">Classes</p></div>
                    <div className="rounded-lg bg-slate-50 p-3"><p className="text-lg font-bold text-green-600">{formatCurrency(studentReport.stats.totalEarnings)}</p><p className="text-xs text-slate-500">Earned</p></div>
                    <div className="rounded-lg bg-slate-50 p-3"><p className="text-lg font-bold">{studentReport.stats.completedCount}</p><p className="text-xs text-slate-500">Completed</p></div>
                  </div>
                </CardContent>
              </Card>

              {studentReport.monthlySummary.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Monthly Earnings</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {studentReport.monthlySummary.map((m: any) => (
                        <li key={m._id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{formatMonth(m._id)}</span>
                          <span className="font-medium">{formatCurrency(m.earnings)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <EmptyState icon={User} title="No data" description="This student has no classes yet." />
          )}
        </TabsContent>

        {/* Yearly report */}
        <TabsContent value="yearly">
          <div className="mb-3">
            <Label>Year</Label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1.5 w-32 h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
            >
              {[2025, 2026, 2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>

          {yearlyLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : yearly ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-lg font-bold">{yearly.summary.totalClasses}</p><p className="text-xs text-slate-500">Classes</p></div>
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-lg font-bold text-green-600">{formatCurrency(yearly.summary.totalEarnings)}</p><p className="text-xs text-slate-500">Total</p></div>
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-lg font-bold">{formatCurrency(yearly.summary.incentiveEarnings)}</p><p className="text-xs text-slate-500">Incentives</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={58} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
                        <Bar dataKey="Earnings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Monthly Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {yearly.monthlyBreakdown.map((m: any) => (
                      <li key={m.month} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{formatMonth(m.month)}</span>
                        <span className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{m.totalClasses} classes</span>
                          <span className="font-medium w-24 text-right">{formatCurrency(m.totalEarnings)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState icon={BarChart3} title="No data" description="No classes recorded for this year." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}