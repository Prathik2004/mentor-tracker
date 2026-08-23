import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { classesApi } from '@/api/classes'
import type { ClassFilters, ClassRecord } from '@/types'
import { getCurrentMonth } from '@/utils/format'
import { ClassCard } from '@/components/classes/ClassCard'
import { ClassFiltersBar } from '@/components/classes/ClassFiltersBar'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ClassFormDialog } from '@/components/classes/ClassFormDialog'
import { BookOpen, Plus } from 'lucide-react'

export function Classes() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<ClassFilters>(() => ({
    month: getCurrentMonth(),
    studentId: searchParams.get('studentId') || searchParams.get('student') || undefined,
    page: 1,
    limit: 20,
  }))
  const [addOpen, setAddOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['classes', filters],
    queryFn: () => classesApi.getAll(filters),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Classes</h1>
        <Button onClick={() => setAddOpen(true)} className="sm:hidden">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <ClassFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !data || data.classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classes found"
          description="Try adjusting your filters or add your first class."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Class
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-slate-500">{data.total} {data.total === 1 ? 'class' : 'classes'} found</p>
          <div className="space-y-3">
            {data.classes.map(cls => (
              <ClassCard key={cls._id} classRecord={cls} onEdit={setEditingClass} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(f => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                disabled={data.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(f => ({ ...f, page: Math.min(data.totalPages, (f.page || 1) + 1) }))}
                disabled={data.page >= data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ClassFormDialog open={addOpen} onOpenChange={setAddOpen} />

      <ClassFormDialog
        open={!!editingClass}
        onOpenChange={(o) => { if (!o) setEditingClass(null) }}
        initialClass={editingClass}
      />
    </div>
  )
}