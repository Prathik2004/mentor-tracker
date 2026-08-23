import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { classesApi } from '@/api/classes'
import type { ClassRecord } from '@/types'
import { CLASS_TYPE_LABELS, CLASS_STATUS_LABELS, SCHEDULING_TYPE_LABELS, CLASS_TYPE_COLORS } from '@/types'
import { formatDate, formatCurrency, formatMonth, formatTime, getStudentName } from '@/utils/format'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast'
import { Clock, Pencil, Trash2 } from 'lucide-react'

export function ClassCard({ classRecord, onEdit }: { classRecord: ClassRecord; onEdit?: (cls: ClassRecord) => void }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const cls = classRecord
  const studentName = getStudentName(cls.studentId, cls.classType)

  const deleteClass = useMutation({
    mutationFn: () => classesApi.delete(cls._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast('Class deleted', 'success')
    },
    onError: () => toast('Could not delete class', 'error'),
  })

  const typeColor = CLASS_TYPE_COLORS[cls.classType]
  const statusVariant =
    cls.status === 'completed' ? 'success' : cls.status === 'student_no_show' ? 'destructive' : 'secondary'

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ background: typeColor }}>
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{studentName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  {formatDate(cls.date)}
                  {cls.time && (
                    <span className="flex items-center gap-1">
                      <span className="text-slate-300">·</span>
                      <Clock className="h-3 w-3" />
                      {formatTime(cls.time)}
                    </span>
                  )}
                </p>
              </div>
              <span className="text-lg font-bold text-slate-900 shrink-0">{formatCurrency(cls.paymentAmount)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge style={{ background: `${typeColor}20`, color: typeColor }} className="border-0">
                {CLASS_TYPE_LABELS[cls.classType]}
              </Badge>
              <Badge variant={statusVariant as any} className="border-0">
                {CLASS_STATUS_LABELS[cls.status]}
              </Badge>
              <Badge variant="outline">{SCHEDULING_TYPE_LABELS[cls.schedulingType]}</Badge>
              {cls.class_no !== null && <Badge variant="outline">Class {cls.class_no}</Badge>}
            </div>
            {cls.notes && <p className="text-xs text-slate-400 mt-2 line-clamp-1">{cls.notes}</p>}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
              <span className="text-[11px] text-slate-400">{formatMonth(cls.classMonth)}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit?.(cls)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {formatCurrency(cls.paymentAmount)} from your {formatMonth(cls.classMonth)} earnings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteClass.mutate()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}