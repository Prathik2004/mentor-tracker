import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { studentsApi } from '@/api/students'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ClassFilters, ClassType, ClassStatus, SchedulingType } from '@/types'
import { CLASS_TYPE_LABELS, CLASS_STATUS_LABELS, SCHEDULING_TYPE_LABELS } from '@/types'

interface ClassFiltersBarProps {
  filters: ClassFilters
  onChange: (filters: ClassFilters) => void
}

export function ClassFiltersBar({ filters, onChange }: ClassFiltersBarProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [showFilters, setShowFilters] = useState(false)
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.getAll(),
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, search: searchTerm || undefined, page: 1 })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const update = (patch: Partial<ClassFilters>) => onChange({ ...filters, ...patch, page: 1 })

  const hasActiveFilters = !!(filters.classType || filters.status || filters.schedulingType || filters.month || filters.studentId || filters.search)

  const clearFilters = () => {
    setSearchTerm('')
    onChange({ page: 1, limit: filters.limit })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by student, type, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="px-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <div>
            <Select
              value={filters.studentId ?? 'all'}
              onValueChange={(v) => update({ studentId: v === 'all' ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student._id} value={student._id}>{student.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.classType ?? 'all'}
              onValueChange={(v) => update({ classType: v === 'all' ? undefined : (v as ClassType) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Class type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(CLASS_TYPE_LABELS) as ClassType[]).map((t) => (
                  <SelectItem key={t} value={t}>{CLASS_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.status ?? 'all'}
              onValueChange={(v) => update({ status: v === 'all' ? undefined : (v as ClassStatus) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(CLASS_STATUS_LABELS) as ClassStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{CLASS_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.schedulingType ?? 'all'}
              onValueChange={(v) => update({ schedulingType: v === 'all' ? undefined : (v as SchedulingType) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Scheduling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(Object.keys(SCHEDULING_TYPE_LABELS) as SchedulingType[]).map((s) => (
                  <SelectItem key={s} value={s}>{SCHEDULING_TYPE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              type="month"
              value={filters.month || ''}
              onChange={(e) => update({ month: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
    </div>
  )
}