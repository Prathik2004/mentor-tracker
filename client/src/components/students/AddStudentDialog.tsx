import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi } from '@/api/students'
import type { Student } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'

interface AddStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the created student so callers can immediately select it. */
  onCreated?: (student: Student) => void
}

export function AddStudentDialog({ open, onOpenChange, onCreated }: AddStudentDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [course, setCourse] = useState('')
  const [age, setAge] = useState('')
  const [notes, setNotes] = useState('')

  const createStudent = useMutation({
    mutationFn: () =>
      studentsApi.create({
        name: name.trim(),
        course: course.trim() || undefined,
        age: age ? Number(age) : undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast(`Student ${student.name} added`, 'success')
      onCreated?.(student)
      resetForm()
      onOpenChange(false)
    },
    onError: () => toast('Could not add student', 'error'),
  })

  function resetForm() {
    setName('')
    setCourse('')
    setAge('')
    setNotes('')
  }

  const submit = () => {
    if (!name.trim()) {
      toast('Student name is required', 'error')
      return
    }
    createStudent.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="student-name">Name *</Label>
            <Input
              id="student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student name"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="student-course">Course</Label>
            <Input
              id="student-course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Web Development"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="student-age">Age</Label>
            <Input
              id="student-age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Optional"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="student-notes">Notes</Label>
            <Textarea
              id="student-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="mt-1.5"
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createStudent.isPending}>Add Student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}