import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, getStudentName } from '@/utils/format'
import { CLASS_TYPE_LABELS, CLASS_STATUS_LABELS } from '@/types'
import type { ClassRecord } from '@/types'

export function RecentActivity({ classes }: { classes: ClassRecord[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Classes
          </CardTitle>
          <Link to="/classes" className="text-xs font-medium text-accent hover:underline">
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No classes yet this month</p>
        ) : (
          <ul className="space-y-2">
            {classes.slice(0, 8).map(cls => (
              <li key={cls._id} className="flex items-center justify-between rounded-lg px-2 -mx-2 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{getStudentName(cls.studentId, cls.classType)}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(cls.date)} · {CLASS_TYPE_LABELS[cls.classType]}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={cls.status === 'completed' ? 'success' : cls.status === 'student_no_show' ? 'destructive' : 'secondary'}
                    className="border-0"
                  >
                    {CLASS_STATUS_LABELS[cls.status]}
                  </Badge>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(cls.paymentAmount)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}