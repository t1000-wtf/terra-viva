import React, { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Cloud, RefreshCw, Sparkles, Droplets, Sun, Layers } from 'lucide-react'
import { Button } from '../../../components/common/Button'
import { Skeleton } from '../../../components/common/Skeleton'
import { cn } from '../../../utils/cn'
import type { EnvironmentalTimeseriesPoint } from '../../../types'

interface EnvironmentalChartProps {
  data?: EnvironmentalTimeseriesPoint[]
  environmentalSummary?: any
  loading?: boolean
  onSync?: () => void
  isSyncing?: boolean
  className?: string
}

type MetricType = 'ndvi' | 'precipitation' | 'soil_moisture' | 'temp_mean'

interface MetricConfig {
  key: MetricType
  label: string
  unit: string
  color: string
  gradientId: string
  icon: React.ComponentType<{ className?: string }>
  formatValue: (v: number | null | undefined) => string
  domain?: [number | string, number | string]
}

const metricConfigs: Record<MetricType, MetricConfig> = {
  ndvi: {
    key: 'ndvi',
    label: 'Índice NDVI',
    unit: '',
    color: '#16a34a',
    gradientId: 'ndviGradient',
    icon: Sparkles,
    formatValue: (v) => (v !== null && v !== undefined ? v.toFixed(2) : '-'),
    domain: [0, 1],
  },
  precipitation: {
    key: 'precipitation',
    label: 'Precipitação',
    unit: 'mm',
    color: '#0284c7',
    gradientId: 'precipGradient',
    icon: Droplets,
    formatValue: (v) => (v !== null && v !== undefined ? `${v.toFixed(1)} mm` : '-'),
    domain: [0, 'auto'],
  },
  soil_moisture: {
    key: 'soil_moisture',
    label: 'Umidade Solo',
    unit: 'm³/m³',
    color: '#0d9488',
    gradientId: 'moistureGradient',
    icon: Layers,
    formatValue: (v) => (v !== null && v !== undefined ? `${v.toFixed(2)} m³/m³` : '-'),
    domain: [0, 'auto'],
  },
  temp_mean: {
    key: 'temp_mean',
    label: 'Temperatura Média',
    unit: '°C',
    color: '#ea580c',
    gradientId: 'tempGradient',
    icon: Sun,
    formatValue: (v) => (v !== null && v !== undefined ? `${v.toFixed(1)} °C` : '-'),
    domain: ['auto', 'auto'],
  },
}

export const EnvironmentalChart: React.FC<EnvironmentalChartProps> = ({
  data = [],
  environmentalSummary,
  loading = false,
  onSync,
  isSyncing = false,
  className,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('ndvi')

  const metric = metricConfigs[selectedMetric]

  // Filter or format chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((item) => {
      let formattedDate = item.date
      try {
        const parts = item.date.split('-')
        if (parts.length === 3) {
          formattedDate = `${parts[2]}/${parts[1]}`
        }
      } catch {
        // fallback to original date string
      }
      return {
        ...item,
        displayDate: formattedDate,
      }
    })
  }, [data])

  const hasData = chartData.length > 0

  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4', className)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col', className)}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-base">
              Dados Ambientais Recentes
            </h3>
            {hasData && (
              <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                {chartData.length} dias
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Séries agroclimatológicas (NASA POWER, SRTM e sensoriamento remoto)
          </p>
        </div>

        {/* Metric Switcher Tabs */}
        {hasData && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
            {(Object.keys(metricConfigs) as MetricType[]).map((key) => {
              const cfg = metricConfigs[key]
              const isSelected = selectedMetric === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMetric(key)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap',
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  )}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Main Chart Body or Empty State */}
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50/50 rounded-xl border border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
            <Cloud className="w-7 h-7" />
          </div>
          <h4 className="font-semibold text-slate-800 text-base mb-1">
            Nenhum dado ambiental recente
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
            Sincronize os dados ambientais para ver o gráfico de vegetação (NDVI), chuva acumulada e temperatura da propriedade.
          </p>
          {onSync && (
            <Button
              onClick={onSync}
              loading={isSyncing}
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />}
            >
              {isSyncing ? 'Sincronizando com satélite...' : 'Sincronizar Dados Ambientais'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Quick Summary Pill Row */}
          {environmentalSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Risco Seca</span>
                <span className="text-xs font-bold text-slate-800">
                  {environmentalSummary.drought_risk || 'BAIXO'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">NDVI Médio</span>
                <span className="text-xs font-bold text-emerald-700">
                  {environmentalSummary.ndvi_mean != null ? environmentalSummary.ndvi_mean.toFixed(2) : '-'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Chuva Total</span>
                <span className="text-xs font-bold text-sky-700">
                  {environmentalSummary.precipitation_total_mm != null ? `${environmentalSummary.precipitation_total_mm.toFixed(0)} mm` : '-'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Erosão</span>
                <span className="text-xs font-bold text-slate-800">
                  {environmentalSummary.erosion_risk || 'BAIXO'}
                </span>
              </div>
            </div>
          )}

          {/* Area Chart */}
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={5}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={metric.domain || [0, 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as EnvironmentalTimeseriesPoint & { displayDate: string }
                      const val = item[metric.key] as number | null | undefined
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-3 rounded-lg shadow-lg text-xs">
                          <p className="font-semibold text-slate-700 mb-1">Data: {item.date}</p>
                          <div className="flex items-center gap-1.5 font-bold" style={{ color: metric.color }}>
                            <span>{metric.label}:</span>
                            <span>{metric.formatValue(val)}</span>
                          </div>
                          {item.confidence_level && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              Confiabilidade: {item.confidence_level}
                            </p>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${metric.gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
export default EnvironmentalChart
