import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi } from '@/api/students'
import type { Student } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'

interface EditStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student
}

export function EditStudentDialog({ open, onOpenChange, student }: EditStudentDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [name, setName] = useState(student.name)
  const [course, setCourse] = useState(student.course || '')
  const [age, setAge] = useState(student.age ? String(student.age) : '')

  useEffect(() => {
    setName(student.name)
    setCourse(student.course || '')
    setAge(student.age ? String(student.age) : '')
  }, [student])

  const updateStudent = useMutation({
    mutationFn: () =>
      studentsApi.update(student._id, {
        name: name.trim(),
        course: course.trim() || undefined,
        age: age ? Number(age) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast('Student updated', 'success')
      onOpenChange(false)
    },
    onError: () => toast('Could not update student', 'error'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name *</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="edit-course">Course</Label>
            <Input id="edit-course" value={course} onChange={(e) => setCourse(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="edit-age">Age</Label>
            <Input id="edit-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => updateStudent.mutate()} disabled={!name.trim() || updateStudent.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}