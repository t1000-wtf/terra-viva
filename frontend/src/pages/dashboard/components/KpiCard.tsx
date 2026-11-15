import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Skeleton } from '../../../components/common/Skeleton'
import { cn } from '../../../utils/cn'

export interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: 'green' | 'blue' | 'amber' | 'red' | 'purple' | string
  trend?: { value: number; label: string; positive: boolean }
  loading?: boolean
  className?: string
  onClick?: () => void
}

const colorVariants: Record<string, { bg: string; text: string; ring: string }> = {
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'border-emerald-100',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    ring: 'border-blue-100',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    ring: 'border-amber-100',
  },
  red: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    ring: 'border-rose-100',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    ring: 'border-purple-100',
  },
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'green',
  trend,
  loading = false,
  className,
  onClick,
}) => {
  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm', className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    )
  }

  const colorScheme = colorVariants[iconColor] || {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'border-emerald-100',
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-200',
        'hover:shadow-md hover:border-slate-300',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0',
              colorScheme.bg,
              colorScheme.text,
              colorScheme.ring
            )}
          >
            <Icon className="w-6 h-6 stroke-[1.8]" />
          </div>

          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
              {title}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {value}
              </span>
            </div>
          </div>
        </div>

        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
              trend.positive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            )}
          >
            {trend.positive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}</span>
          </div>
        )}
      </div>

      {(subtitle || trend?.label) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle || trend?.label}</span>
        </div>
      )}
    </div>
  )
}
export default KpiCard
