import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentRulesApi } from '@/api/paymentRules'
import { settingsApi } from '@/api/settings'
import { incentiveTypesApi } from '@/api/incentiveTypes'
import type { PaymentRule, ClassType } from '@/types'
import { CLASS_TYPE_LABELS } from '@/types'
import { formatCurrency } from '@/utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { CreditCard, Download, Save, Trash2, Info, Plus } from 'lucide-react'

const STATUS_LABELS = { completed: 'Completed', student_no_show: 'Student No-show' }

export function Settings() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [editRule, setEditRule] = useState<PaymentRule | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [windowStart, setWindowStart] = useState('10')
  const [windowEnd, setWindowEnd] = useState('15')
  const [windowDirty, setWindowDirty] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newRuleType, setNewRuleType] = useState<ClassType | ''>('')
  const [newRuleStatus, setNewRuleStatus] = useState<'' | 'completed' | 'student_no_show'>('')
  const [newRuleAmount, setNewRuleAmount] = useState('')

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['payment-rules'],
    queryFn: () => paymentRulesApi.getAll(),
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll(),
  })

  useEffect(() => {
    if (settings && !windowDirty) {
      if (settings.payment_window_start !== undefined) setWindowStart(String(settings.payment_window_start))
      if (settings.payment_window_end !== undefined) setWindowEnd(String(settings.payment_window_end))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  const { data: types } = useQuery({
    queryKey: ['incentive-types'],
    queryFn: () => incentiveTypesApi.getAll(),
  })

  const updateRule = useMutation({
    mutationFn: () =>
      paymentRulesApi.update({
        classType: editRule!.classType,
        status: editRule!.status,
        amount: Number(editAmount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-rules'] })
      toast('Payment rule updated. Future classes will use the new rate.', 'success')
      setEditRule(null)
    },
    onError: () => toast('Could not update payment rule', 'error'),
  })

  // If an active rule already exists for the chosen combo, "add" becomes "replace"
  const matchingRule = rules?.find(
    r => r.classType === newRuleType && r.status === newRuleStatus && r.effectiveTo === null
  )

  const addRule = useMutation({
    mutationFn: () =>
      paymentRulesApi.update({
        classType: newRuleType as string,
        status: newRuleStatus,
        amount: Number(newRuleAmount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-rules'] })
      toast(
        matchingRule
          ? 'Payment rule updated. Future classes will use the new rate.'
          : 'Payment rule added. Future classes will use this rate.',
        'success'
      )
      setNewRuleType('')
      setNewRuleStatus('')
      setNewRuleAmount('')
    },
    onError: () => toast('Could not add payment rule', 'error'),
  })

  const canAddRule =
    !!newRuleType && !!newRuleStatus && newRuleAmount !== '' && Number(newRuleAmount) >= 0 && !addRule.isPending

  const saveWindow = useMutation({
    mutationFn: () =>
      settingsApi.update({
        payment_window_start: Number(windowStart),
        payment_window_end: Number(windowEnd),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setWindowDirty(false)
      toast('Payment cycle updated', 'success')
    },
    onError: () => toast('Could not save payment cycle', 'error'),
  })

  const addType = useMutation({
    mutationFn: () => incentiveTypesApi.create(newTypeName.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentive-types'] })
      setNewTypeName('')
      toast('Incentive type added', 'success')
    },
    onError: () => toast('Could not add incentive type', 'error'),
  })

  const deleteType = useMutation({
    mutationFn: (id: string) => incentiveTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentive-types'] })
      toast('Incentive type deleted', 'success')
    },
    onError: () => toast('Could not delete incentive type', 'error'),
  })

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const res = await fetch(`/api/reports/export/${format}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mentor-data.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast(`Data exported as ${format.toUpperCase()}`, 'success')
    } catch {
      toast('Export failed', 'error')
    }
  }

  const groups = (
    ['regular', 'demo', 'substitute', 'ptm'] as ClassType[]
  ).map(t => ({
    type: t,
    rules: rules?.filter(r => r.classType === t && r.effectiveTo === null) ?? [],
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Payment Rules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Changing a payment rule only affects future classes. Historical classes keep the rate that was applied when they were created.
            </span>
          </div>

          {/* Add a new rule */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-2 mb-4">
            <p className="text-sm font-semibold text-slate-700">Add New Rule</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="rule-type">Class Type</Label>
                <Select value={newRuleType} onValueChange={(v) => setNewRuleType(v as ClassType)}>
                  <SelectTrigger id="rule-type" className="mt-1">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CLASS_TYPE_LABELS) as ClassType[]).map(t => (
                      <SelectItem key={t} value={t}>{CLASS_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rule-status">Status</Label>
                <Select value={newRuleStatus} onValueChange={(v) => setNewRuleStatus(v as 'completed' | 'student_no_show')}>
                  <SelectTrigger id="rule-status" className="mt-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as Array<'completed' | 'student_no_show'>).map(s => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="rule-amount-new">Amount (₹)</Label>
              <Input
                id="rule-amount-new"
                type="number"
                value={newRuleAmount}
                onChange={(e) => setNewRuleAmount(e.target.value)}
                className="mt-1"
                min="0"
                placeholder="e.g. 300"
              />
            </div>
            {matchingRule && newRuleType && newRuleStatus && (
              <p className="text-xs text-amber-800 bg-amber-50 rounded-md p-2">
                A rule for {CLASS_TYPE_LABELS[newRuleType]} · {STATUS_LABELS[newRuleStatus]} already exists at{' '}
                {formatCurrency(matchingRule.amount)}. Saving will replace it.
              </p>
            )}
            <Button size="sm" onClick={() => addRule.mutate()} disabled={!canAddRule} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> {matchingRule ? 'Update Rule' : 'Add Rule'}
            </Button>
          </div>

          {rulesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map(({ type, rules: groupRules }) => (
                <div key={type}>
                  <p className="text-sm font-semibold text-slate-700 mb-2">{CLASS_TYPE_LABELS[type]}</p>
                  <div className="space-y-1.5">
                    {groupRules.map(rule => (
                      <div key={rule._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-sm text-slate-600">{STATUS_LABELS[rule.status]}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{formatCurrency(rule.amount)}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditRule(rule); setEditAmount(String(rule.amount)) }}
                          >
                            Edit
                          </Button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Cycle */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500">Payment Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="win-start">Window Start (day)</Label>
              <Input
                id="win-start"
                type="number"
                value={windowStart}
                onChange={(e) => { setWindowStart(e.target.value); setWindowDirty(true) }}
                className="mt-1.5"
                min="1"
                max="31"
              />
            </div>
            <div>
              <Label htmlFor="win-end">Window End (day)</Label>
              <Input
                id="win-end"
                type="number"
                value={windowEnd}
                onChange={(e) => { setWindowEnd(e.target.value); setWindowDirty(true) }}
                className="mt-1.5"
                min="1"
                max="31"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Payment window is the 10th–15th of the month following the classes.</p>
          <Button onClick={() => saveWindow.mutate()} disabled={!windowDirty || saveWindow.isPending} className="mt-3">
            <Save className="h-4 w-4 mr-1" /> Save Payment Cycle
          </Button>
        </CardContent>
      </Card>

      {/* Incentive Types */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500">Incentive Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="New incentive type"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
            <Button onClick={() => newTypeName.trim() && addType.mutate()} disabled={!newTypeName.trim() || addType.isPending}>
              Add
            </Button>
          </div>
          <div className="space-y-1.5">
            {types?.map(type => (
              <div key={type._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">{type.name}</span>
                {!type.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => deleteType.mutate(type._id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}>Export CSV</Button>
            <Button variant="outline" onClick={() => handleExport('json')}>Export JSON</Button>
          </div>
          <p className="text-xs text-slate-400 mt-3">Download all your financial records for backup.</p>
        </CardContent>
      </Card>

      {/* Edit rule dialog */}
      <Dialog open={!!editRule} onOpenChange={(o) => !o && setEditRule(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Payment Rule</DialogTitle>
          </DialogHeader>
          {editRule && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-800">
                  {CLASS_TYPE_LABELS[editRule.classType]} · {STATUS_LABELS[editRule.status]}
                </p>
                <p className="text-xs text-slate-400 mt-1">Current: {formatCurrency(editRule.amount)}</p>
              </div>
              <div>
                <Label htmlFor="rule-amount">New Amount (₹)</Label>
                <Input
                  id="rule-amount"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="mt-1.5"
                  min="0"
                  autoFocus
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditRule(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (Number(editAmount) < 0) {
                  toast('Amount cannot be negative', 'error')
                  return
                }
                updateRule.mutate()
              }}
              disabled={updateRule.isPending}
            >
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}