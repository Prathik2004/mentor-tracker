import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { studentsApi } from '@/api/students'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AddStudentDialog } from '@/components/students/AddStudentDialog'
import { Users, Search, Plus, GraduationCap } from 'lucide-react'

export function Students() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', search],
    queryFn: () => studentsApi.getAll(search || undefined),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !students || students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Add your first student to begin tracking their classes."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Student
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((s) => (
            <button
              key={s._id}
              onClick={() => navigate(`/students/${s._id}`)}
              className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                  {s.course && <p className="text-xs text-slate-500 truncate">{s.course}</p>}
                </div>
                <Badge variant={s.status === 'active' ? 'success' : 'secondary'} className="border-0">
                  {s.status}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}