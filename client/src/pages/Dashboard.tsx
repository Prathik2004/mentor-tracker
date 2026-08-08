import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'
import { getCurrentMonth, getGreeting } from '@/utils/format'
import { MonthPicker } from '@/components/ui/month-picker'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { StatCards } from '@/components/dashboard/StatCards'
import { PaymentStatusCard } from '@/components/dashboard/PaymentStatusCard'
import { TodaySummary } from '@/components/dashboard/TodaySummary'
import { ClassBreakdown } from '@/components/dashboard/ClassBreakdown'
import { EarningsBreakdown } from '@/components/dashboard/EarningsBreakdown'
import { WeeklyStats } from '@/components/dashboard/WeeklyStats'
import { TopStudents } from '@/components/dashboard/TopStudents'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { InsightsCard } from '@/components/dashboard/InsightsCard'
import { MonthlyChart } from '@/components/dashboard/MonthlyChart'

export function Dashboard() {
  const [month, setMonth] = useState(getCurrentMonth())

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', month],
    queryFn: () => dashboardApi.getStats(month),
  })

  const { data: history } = useQuery({
    queryKey: ['monthly-history'],
    queryFn: () => dashboardApi.getMonthlyHistory(),
  })

  const { data: insights } = useQuery({
    queryKey: ['insights', month],
    queryFn: () => dashboardApi.getInsights(month),
  })

  if (isLoading) return <DashboardSkeleton />
  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm">{getGreeting()} 👋</p>
          <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <StatCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PaymentStatusCard stats={stats} month={month} />
        <TodaySummary classes={stats.todayClasses} earnings={stats.todayEarnings} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClassBreakdown breakdown={stats.classBreakdown} />
        <EarningsBreakdown stats={stats} />
      </div>

      {history && history.length > 0 && <MonthlyChart data={history} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyStats stats={stats.weekStats} />
        <TopStudents students={stats.topStudents} />
      </div>

      {insights && insights.length > 0 && <InsightsCard insights={insights} />}

      <RecentActivity classes={stats.recentClasses} />
    </div>
  )
}