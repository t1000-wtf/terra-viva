import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Lightbulb } from 'lucide-react'
import { Badge } from '../../../components/common/Badge'
import { Skeleton } from '../../../components/common/Skeleton'
import { cn } from '../../../utils/cn'

export interface AlertData {
  id: number
  severity: string
  title: string
  description?: string
  recommended_action?: string
  alert_type?: string
  type?: string
  created_at?: string
}

interface AlertsListProps {
  alerts: AlertData[]
  propertyId?: number
  loading?: boolean
  className?: string
  maxItems?: number
}

const severityConfig: Record<
  string,
  {
    variant: 'danger' | 'warning' | 'info' | 'default'
    label: string
    badgeClass: string
    borderClass: string
  }
> = {
  CRITICAL: {
    variant: 'danger',
    label: 'Crítico',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    borderClass: 'border-l-rose-500',
  },
  HIGH: {
    variant: 'warning',
    label: 'Alto',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    borderClass: 'border-l-amber-500',
  },
  MEDIUM: {
    variant: 'warning',
    label: 'Médio',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    borderClass: 'border-l-yellow-400',
  },
  LOW: {
    variant: 'info',
    label: 'Baixo',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    borderClass: 'border-l-blue-400',
  },
}

export const AlertsList: React.FC<AlertsListProps> = ({
  alerts = [],
  propertyId,
  loading = false,
  className,
  maxItems = 5,
}) => {
  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4', className)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-lg border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const displayedAlerts = alerts.slice(0, maxItems)
  const hasAlerts = displayedAlerts.length > 0

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            hasAlerts ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          )}>
            {hasAlerts ? <AlertTriangle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Alertas Ativos</h3>
            <p className="text-xs text-slate-500">Monitoramento biofísico e climático</p>
          </div>
        </div>

        {hasAlerts ? (
          <Badge variant={alerts.some((a) => a.severity === 'CRITICAL') ? 'danger' : 'warning'}>
            {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
          </Badge>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Regular
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3">
        {!hasAlerts ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-100 p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-medium text-slate-800 text-sm">Nenhum alerta ativo</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Todos os parâmetros de solo, clima e vegetação da propriedade estão dentro das faixas normais.
            </p>
          </div>
        ) : (
          displayedAlerts.map((alert) => {
            const severityKey = alert.severity?.toUpperCase() || 'LOW'
            const config = severityConfig[severityKey] || severityConfig.LOW
            const actionText = alert.recommended_action

            return (
              <div
                key={alert.id}
                className={cn(
                  'p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/40 hover:bg-white',
                  'transition-all duration-150 border-l-4',
                  config.borderClass
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={cn(
                      'text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md border tracking-wider',
                      config.badgeClass
                    )}
                  >
                    {config.label}
                  </span>
                  {(alert.alert_type || alert.type) && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {alert.alert_type || alert.type}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                  {alert.title}
                </h4>

                {alert.description && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>
                )}

                {actionText && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-xs text-slate-700 bg-white/80 p-2 rounded border border-slate-100">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-900">Ação recomendada: </span>
                      <span>{actionText}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer link to diagnostic page */}
      {propertyId && (
        <div className="pt-3.5 mt-3 border-t border-slate-100 text-right">
          <Link
            to={`/diagnostics/${propertyId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>Ver diagnóstico completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
export default AlertsList
