import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesApi } from '@/api/classes'
import { studentsApi } from '@/api/students'
import { paymentRulesApi } from '@/api/paymentRules'
import type { ClassRecord, ClassType, ClassStatus, SchedulingType } from '@/types'
import { CLASS_TYPE_LABELS, CLASS_STATUS_LABELS, SCHEDULING_TYPE_LABELS } from '@/types'
import { getMonthFromDate, formatMonth } from '@/utils/format'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddStudentDialog } from '@/components/students/AddStudentDialog'
import { useToast } from '@/components/ui/toast'
import { Search, UserPlus, X } from 'lucide-react'

function todayISO(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().split('T')[0]
}

/** Convert an ISO date string to a YYYY-MM-DD value for <input type="date">. */
function toDateInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return todayISO()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().split('T')[0]
}

function getStudentId(cls: ClassRecord): string {
  return cls.studentId && typeof cls.studentId === 'object' ? cls.studentId._id : (cls.studentId || '')
}

interface ClassFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, the dialog edits this class instead of adding a new one. */
  initialClass?: ClassRecord | null
}

export function ClassFormDialog({ open, onOpenChange, initialClass }: ClassFormDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEdit = !!initialClass

  const [date, setDate] = useState(todayISO())
  const [studentId, setStudentId] = useState('')
  const [classType, setClassType] = useState<ClassType>()
  const [status, setStatus] = useState<ClassStatus>()
  const [schedulingType, setSchedulingType] = useState<SchedulingType>()
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showStudentList, setShowStudentList] = useState(false)
  const [addingStudent, setAddingStudent] = useState(false)
  const [duplicateConfirm, setDuplicateConfirm] = useState(false)

  // Sync form fields when the dialog opens (edit: pre-fill from the class, add: reset)
  useEffect(() => {
    if (!open) return
    if (initialClass) {
      setDate(toDateInputValue(initialClass.date))
      setStudentId(getStudentId(initialClass))
      setClassType(initialClass.classType)
      setStatus(initialClass.status)
      setSchedulingType(initialClass.schedulingType)
      setNotes(initialClass.notes || '')
      setSearchTerm('')
      setShowStudentList(false)
      setDuplicateConfirm(false)
    } else {
      resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialClass])

  const { data: students } = useQuery({
    queryKey: ['students', searchTerm],
    queryFn: () => studentsApi.getAll(searchTerm || undefined),
  })

  const { data: estimate } = useQuery({
    queryKey: ['payment-estimate', classType, status, date],
    queryFn: () => paymentRulesApi.calculate(classType!, status!, date),
    enabled: !!classType && !!status,
  })

  
  
  const saveClass = useMutation({
    mutationFn: () => {
      const payload = {
        date,
        studentId: studentId || null,
        classType: classType!,
        status: status!,
        schedulingType: schedulingType!,
        notes: notes || undefined,
        confirmDuplicate: duplicateConfirm,
      }
      return isEdit && initialClass
        ? classesApi.update(initialClass._id, payload)
        : classesApi.create(payload)
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      const studentName = saved.studentId && typeof saved.studentId === 'object' ? saved.studentId.name : ''
      const amount = saved.paymentAmount !== undefined ? `₹${saved.paymentAmount}` : ''
      toast(isEdit ? `✓ Class updated — ${studentName}, ${amount}` : `✓ Class added — ${studentName}, ${amount}`, 'success')
      if (!isEdit) resetForm()
      onOpenChange(false)
    },
    onError: (err: any) => {
      if (!isEdit && err?.status === 409 && err?.warning === 'duplicate' && !duplicateConfirm) {
        setDuplicateConfirm(true)
      } else {
        toast('Something went wrong. Your class was not saved.', 'error')
      }
    },
  })

  function resetForm() {
    setDate(todayISO())
    setStudentId('')
    setClassType(undefined)
    setStatus(undefined)
    setSchedulingType(undefined)
    setNotes('')
    setSearchTerm('')
    setDuplicateConfirm(false)
  }

  const canSubmit = !!date && !!classType && !!status && !!schedulingType && (classType === 'demo' ? true : !!studentId)

  const selectedStudent = students?.find(s => s._id === studentId)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false) }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Class' : 'Add Class'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <Label htmlFor="class-date">Date</Label>
            <Input
              id="class-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Student selector */}
          <div>
            <Label>
              Student{classType === 'demo' && <span className="text-xs font-normal text-slate-400"> (optional for demo)</span>}
            </Label>
            {selectedStudent ? (
              <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="font-medium text-slate-900">{selectedStudent.name}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStudentId('')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative mt-1.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowStudentList(true)}
                    className="pl-9"
                  />
                </div>
                {showStudentList && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                    {students?.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                        onClick={() => { setStudentId(s._id); setShowStudentList(false) }}
                      >
                        {s.name}
                        {s.course && <span className="text-xs text-slate-400 ml-2">{s.course}</span>}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm font-medium text-accent hover:bg-slate-50"
                      onClick={() => { setShowStudentList(false); setAddingStudent(true) }}
                    >
                      <UserPlus className="h-4 w-4" /> Add New Student
                    </button>
                  </div>
                )}
              </div>
            )}

            </div>

          {/* Class Type */}
          <div>
            <Label>Class Type</Label>
            <Select value={classType} onValueChange={(v) => setClassType(v as ClassType)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CLASS_TYPE_LABELS) as ClassType[]).map((t) => (
                  <SelectItem key={t} value={t}>{CLASS_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ClassStatus)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CLASS_STATUS_LABELS) as ClassStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{CLASS_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduling Type */}
          <div>
            <Label>Scheduling</Label>
            <Select value={schedulingType} onValueChange={(v) => setSchedulingType(v as SchedulingType)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select scheduling" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SCHEDULING_TYPE_LABELS) as SchedulingType[]).map((s) => (
                  <SelectItem key={s} value={s}>{SCHEDULING_TYPE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="class-notes">Notes (optional)</Label>
            <Textarea
              id="class-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Student requested extra help with React hooks."
              className="mt-1.5"
            />
          </div>

          {/* Estimated earnings */}
          {estimate && (
            <div className="rounded-lg bg-green-50 border border-green-100 p-4 text-center">
              <p className="text-xs text-green-700 uppercase tracking-wide font-medium">
                {isEdit ? 'Estimated Earnings (current rules)' : 'Estimated Earnings'}
              </p>
              <p className="text-2xl font-bold text-green-700">{Number(estimate.amount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-green-600">{formatMonth(getMonthFromDate(date))}</p>
            </div>
          )}

          {/* Duplicate warning (add mode only) */}
          {duplicateConfirm && !isEdit && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              This looks like a duplicate class. Are you sure you want to add it?
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => saveClass.mutate()}
            disabled={!canSubmit || saveClass.isPending}
          >
            {saveClass.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Class'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Popup to create a student from within the class form */}
      <AddStudentDialog
        open={addingStudent}
        onOpenChange={setAddingStudent}
        onCreated={(student) => setStudentId(student._id)}
      />
    </Dialog>
  )
}
