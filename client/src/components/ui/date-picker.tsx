import * as React from 'react'

import { cn } from '@/utils/cn'
import { Label } from '@/components/ui/label'

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  className?: string
  id?: string
  min?: string
  max?: string
  disabled?: boolean
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, label, className, id, ...props }, ref) => {
    const inputId = id ?? React.useId()

    return (
      <div className={cn('grid gap-1.5', className)}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <input
          ref={ref}
          type="date"
          id={inputId}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
          )}
          {...props}
        />
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
export type { DatePickerProps }
