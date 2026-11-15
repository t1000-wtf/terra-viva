import React from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  title?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  hoverable?: boolean
  noPadding?: boolean
}

export function Card({
  title,
  actions,
  children,
  className,
  bodyClassName,
  hoverable = false,
  noPadding = false,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm',
        hoverable && 'hover:shadow-md hover:border-slate-300 transition-all cursor-pointer',
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          {title && <h3 className="font-semibold text-slate-900">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-5', bodyClassName)}>{children}</div>
    </div>
  )
}
