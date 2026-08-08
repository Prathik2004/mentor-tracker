import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { incentivesApi } from '@/api/incentives'
import { incentiveTypesApi } from '@/api/incentiveTypes'
import type { IncentiveType } from '@/types'
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
import { useToast } from '@/components/ui/toast'

function todayISO(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().split('T')[0]
}

interface AddIncentiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddIncentiveDialog({ open, onOpenChange }: AddIncentiveDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [date, setDate] = useState(todayISO())
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const { data: types } = useQuery({
    queryKey: ['incentive-types'],
    queryFn: () => incentiveTypesApi.getAll(),
  })

  const month = getMonthFromDate(date)

  const createIncentive = useMutation({
    mutationFn: () =>
      incentivesApi.create({
        date,
        type,
        description: description.trim() || undefined,
        amount: Number(amount),
        month,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (incentive) => {
      queryClient.invalidateQueries({ queryKey: ['incentives'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast(`✓ Incentive added — ₹${incentive.amount} added to ${formatMonth(month)} earnings.`, 'success')
      resetForm()
      onOpenChange(false)
    },
    onError: () => toast('Could not add incentive', 'error'),
  })

  function resetForm() {
    setDate(todayISO())
    setType('')
    setDescription('')
    setAmount('')
    setNotes('')
  }

  const amountNum = Number(amount)
  const valid = !!date && !!type && !isNaN(amountNum) && amountNum > 0

  const submit = () => {
    if (!valid) {
      toast('Incentive type and a valid amount are required', 'error')
      return
    }
    createIncentive.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Incentive</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="inc-date">Date</Label>
            <Input id="inc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Incentive Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types?.map((t: IncentiveType) => (
                  <SelectItem key={t._id} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="inc-desc">Description</Label>
            <Input
              id="inc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly target achieved"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="inc-amount">Amount (₹) *</Label>
            <Input
              id="inc-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              min="1"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Month</Label>
            <p className="mt-1.5 text-sm text-slate-700 font-medium">{formatMonth(month)}</p>
          </div>
          <div>
            <Label htmlFor="inc-notes">Notes</Label>
            <Textarea id="inc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || createIncentive.isPending}>Add Incentive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}