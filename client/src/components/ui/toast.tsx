import * as React from 'react'
import { X } from 'lucide-react'

import { cn } from '@/utils/cn'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all animate-in fade-in-0 slide-in-from-top-2',
        toast.type === 'success' && 'border-green-200 bg-green-50 text-green-800',
        toast.type === 'error' && 'border-red-200 bg-red-50 text-red-800',
        toast.type === 'info' && 'border-blue-200 bg-blue-50 text-blue-800'
      )}
      role="alert"
    >
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

let toastCount = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${++toastCount}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const contextValue = React.useMemo<ToastContextValue>(
    () => ({ toast: addToast }),
    [addToast]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 p-4">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
