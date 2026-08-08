import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'

interface MonthPickerProps {
  value: string // "YYYY-MM" format
  onChange: (value: string) => void
  className?: string
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

function parseYearMonth(value: string): { year: number; month: number } {
  const [yearStr, monthStr] = value.split('-')
  return { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) }
}

function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function getDisplayLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const { year, month } = parseYearMonth(value)

  const handlePrevMonth = () => {
    if (month === 1) {
      onChange(formatYearMonth(year - 1, 12))
    } else {
      onChange(formatYearMonth(year, month - 1))
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      onChange(formatYearMonth(year + 1, 1))
    } else {
      onChange(formatYearMonth(year, month + 1))
    }
  }

  const handleThisMonth = () => {
    const now = new Date()
    onChange(formatYearMonth(now.getFullYear(), now.getMonth() + 1))
  }

  const now = new Date()
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        aria-label="Previous month"
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-[10rem] text-center text-sm font-medium">
        {getDisplayLabel(year, month)}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        aria-label="Next month"
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentMonth && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleThisMonth}
          className="text-xs"
        >
          This Month
        </Button>
      )}
    </div>
  )
}

export { MonthPicker }
export type { MonthPickerProps }
