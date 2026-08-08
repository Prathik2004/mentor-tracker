import { Sun } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getStudentName } from '@/utils/format'
import { CLASS_TYPE_LABELS, CLASS_STATUS_LABELS } from '@/types'
import type { ClassRecord } from '@/types'

export function TodaySummary({ classes, earnings }: { classes: ClassRecord[]; earnings: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          Today's Classes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {classes.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No classes today</p>
        ) : (
          <ul className="space-y-2">
            {classes.slice(0, 5).map(cls => (
              <li key={cls._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{getStudentName(cls.studentId)}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(cls.date)} · {CLASS_TYPE_LABELS[cls.classType]} · {CLASS_STATUS_LABELS[cls.status]}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cls.status === 'completed' && <Badge variant="success">Done</Badge>}
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(cls.paymentAmount)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-500">Today's Earnings</span>
          <span className="text-base font-bold text-slate-900">{formatCurrency(earnings)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
