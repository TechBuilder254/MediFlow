import { cn } from '@/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      className={cn(
        'rounded-2xl border border-navy-100 bg-white p-6 shadow-sm',
        hover && 'transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger'
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-sky-50 text-accent-600',
    success: 'bg-emerald-50 text-success',
    warning: 'bg-amber-50 text-warning',
    danger: 'bg-red-50 text-danger',
  }

  return (
    <Card hover className="flex items-start gap-4">
      <div className={cn('rounded-xl p-3', colors[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-navy-500 truncate">{title}</p>
        <p className="text-2xl font-bold font-display text-navy-900 mt-0.5">{value}</p>
        {trend && <p className="text-xs text-navy-400 mt-1">{trend}</p>}
      </div>
    </Card>
  )
}
