import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { formatMonthShort, formatCurrency } from '@/utils/format'
import type { MonthlyHistory } from '@/types'

export function MonthlyChart({ data }: { data: MonthlyHistory[] }) {
  const chartData = data
    .map(d => ({
      name: formatMonthShort(d.month),
      Classes: d.classEarnings,
      Incentives: d.incentiveEarnings,
    }))
    .reverse()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Monthly Earnings Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatCurrency(v)}
                width={64}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="Classes" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Incentives" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}