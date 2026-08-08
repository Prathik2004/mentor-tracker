import { Trophy } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'
import type { DashboardStats } from '@/types'

export function TopStudents({ students }: { students: DashboardStats['topStudents'] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top Students
        </CardTitle>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No student data yet</p>
        ) : (
          <ul className="space-y-2.5">
            {students.map((s, i) => (
              <li key={s._id} className="flex items-center justify-between">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800 truncate">{s.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{s.count} classes</span>
                </span>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(s.earnings)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}