import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastItem } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
} as const

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
} as const

const ICON_STYLES = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-sky-500',
} as const

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = ICONS[item.type]
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 w-80 rounded-xl border px-4 py-3 shadow-lg toast-enter',
        STYLES[item.type],
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', ICON_STYLES[item.type])} />
      <p className="text-sm font-medium flex-1 leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Toaster() {
  const { toasts, remove } = useToastStore()

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onClose={() => remove(item.id)} />
      ))}
    </div>
  )
}
