import React from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  hint?: string
}

export function Input({
  label,
  error,
  startIcon,
  endIcon,
  hint,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {startIcon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none">
            {startIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full border rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            'transition-colors',
            error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300',
            startIcon ? 'pl-9' : 'pl-3',
            endIcon ? 'pr-9' : 'pr-3',
            'py-2',
            className
          )}
          {...props}
        />
        {endIcon && (
          <span className="absolute right-3 text-slate-400">{endIcon}</span>
        )}
      </div>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
