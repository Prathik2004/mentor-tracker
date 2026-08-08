import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { CLASS_TYPE_LABELS, CLASS_TYPE_COLORS } from '@/types'
import type { ClassType } from '@/types'

const CLASS_TYPES: ClassType[] = ['regular', 'demo', 'substitute', 'ptm']

export function ClassBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const data = CLASS_TYPES.map(type => ({
    name: CLASS_TYPE_LABELS[type],
    value: breakdown[type] ?? 0,
    color: CLASS_TYPE_COLORS[type],
  })).filter(d => d.value > 0)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Class Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No classes this month</p>
        ) : (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1.5 mt-2">
              {data.map(d => (
                <li key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-medium text-slate-900">{d.value}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
