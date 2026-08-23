import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { studentsApi } from '@/api/students'
import { reportsApi } from '@/api/reports'
import { EditStudentDialog } from '@/components/students/EditStudentDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { formatDate, formatCurrency, formatMonth } from '@/utils/format'
import { CLASS_TYPE_LABELS, CLASS_TYPE_COLORS } from '@/types'
import type { ClassRecord } from '@/types'
import { ArrowLeft, Pencil, Trash2, BookOpen, IndianRupee } from 'lucide-react'

export function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: report, isLoading } = useQuery({
    queryKey: ['student-report', id],
    queryFn: () => reportsApi.getStudent(id!),
    enabled: !!id,
  })

  const deleteStudent = useMutation({
    mutationFn: () => studentsApi.delete(id!),
    onSuccess: () => {
      toast('Student deleted', 'success')
      navigate('/students')
    },
    onError: () => toast('Could not delete student', 'error'),
  })

  if (isLoading || !report) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  const { student, stats, monthlySummary, classes } = report

  const statItems = [
    { label: 'Total Classes', value: String(stats.totalClasses) },
    { label: 'Completed', value: String(stats.completedCount) },
    { label: 'No-show', value: String(stats.noShowCount) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/students')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Students
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold">{student.name}</h1>
              {student.course && <p className="text-sm text-slate-500">{student.course}</p>}
            </div>
            <Badge variant={student.status === 'active' ? 'success' : 'secondary'} className="border-0">
              {student.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {statItems.map(item => (
          <Card key={item.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold text-slate-900">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-sm text-slate-600 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-green-600" />
            Total Earned
          </span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</span>
        </CardContent>
      </Card>

      {monthlySummary.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {monthlySummary.map((m: any) => (
                <li key={m._id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{formatMonth(m._id)}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{m.classCount} classes</span>
                    <span className="font-medium text-slate-900">{formatCurrency(m.earnings)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500">Class History</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No classes for this student yet</p>
          ) : (
            <ul className="space-y-2">
              {classes.map((cls: ClassRecord) => (
                <li key={cls._id} className="flex items-center justify-between rounded-lg px-2 -mx-2 hover:bg-slate-50">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CLASS_TYPE_COLORS[cls.classType] }} />
                    <span className="text-sm text-slate-700 truncate">
                      {formatDate(cls.date)} · {CLASS_TYPE_LABELS[cls.classType]}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-slate-900 shrink-0">{formatCurrency(cls.paymentAmount)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to={`/classes?studentId=${student._id}`} className="block text-center text-xs font-medium text-accent mt-3">
            View all in Classes
          </Link>
        </CardContent>
      </Card>

      <EditStudentDialog open={editOpen} onOpenChange={setEditOpen} student={student} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this student?</AlertDialogTitle>
            <AlertDialogDescription>
              {stats.totalClasses > 0
                ? `This student has ${stats.totalClasses} classes. You cannot delete a student with existing class records.`
                : 'This will permanently remove the student.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {stats.totalClasses === 0 && (
              <AlertDialogAction onClick={() => deleteStudent.mutate()}>Delete</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}