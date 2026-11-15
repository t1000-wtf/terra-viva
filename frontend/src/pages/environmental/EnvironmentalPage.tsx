import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Satellite,
  Thermometer,
  CloudRain,
  Droplets,
  Activity,
  Layers,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowLeft,
  Sun,
  Mountain
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { environmentalApi } from '../../api/environmental'
import type {
  EnvironmentalTimeseriesResponse,
  EnvironmentalTimelinePoint,
  EnvironmentalSyncResponse
} from '../../types'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { PageHeader } from '../../components/common/PageHeader'
import { Skeleton } from '../../components/common/Skeleton'

type DateRangeOption = 30 | 90 | 180 | 365

export default function EnvironmentalPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const propIdNum = propertyId ? parseInt(propertyId, 10) : NaN

  const [dateRange, setDateRange] = useState<DateRangeOption>(30)
  const [loading, setLoading] = useState<boolean>(true)
  const [syncing, setSyncing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<EnvironmentalSyncResponse | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [data, setData] = useState<EnvironmentalTimeseriesResponse | null>(null)

  const fetchTimeseries = useCallback(async () => {
    if (isNaN(propIdNum)) {
      setError('ID de propriedade inválido.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await environmentalApi.getTimeseries(propIdNum, dateRange)
      setData(res)
    } catch (err: any) {
      console.error('Erro ao buscar série temporal ambiental:', err)
      setError(
        err?.response?.data?.detail ||
          'Não foi possível carregar os dados ambientais. Tente novamente mais tarde.'
      )
    } finally {
      setLoading(false)
    }
  }, [propIdNum, dateRange])

  useEffect(() => {
    fetchTimeseries()
  }, [fetchTimeseries])

  const handleSync = async () => {
    if (isNaN(propIdNum)) return
    try {
      setSyncing(true)
      setSyncError(null)
      setSyncResult(null)
      const res = await environmentalApi.sync(propIdNum, dateRange)
      setSyncResult(res)
      await fetchTimeseries()
    } catch (err: any) {
      console.error('Erro na sincronização:', err)
      setSyncError(
        err?.response?.data?.detail ||
          'Falha ao sincronizar dados com os serviços da NASA. Verifique a conexão e tente novamente.'
      )
    } finally {
      setSyncing(false)
    }
  }

  const timeline = data?.timeline || []
  const hasTimeline = timeline.length > 0
  const summary = data?.summary || {}

  const formattedTimeline = timeline.map((item: EnvironmentalTimelinePoint) => {
    const rawDate = item.date || ''
    const shortDate = rawDate.length >= 10 ? rawDate.slice(5) : rawDate
    const tempMean = item.temp_mean ?? (item as any).temperature_mean_c ?? null
    const tempMax = item.temp_max ?? (item as any).temperature_max_c ?? null
    const tempMin = item.temp_min ?? (item as any).temperature_min_c ?? null
    const precip = item.precipitation ?? (item as any).precipitation_mm ?? 0
    const soilMoist = item.soil_moisture ?? (item as any).soil_moisture_m3_m3 ?? null
    const ndviVal = item.ndvi ?? null
    const et0 = item.evapotranspiration ?? (item as any).evapotranspiration_mm ?? 0

    return {
      date: rawDate,
      displayDate: shortDate,
      temp_mean: tempMean !== null ? Number(tempMean.toFixed(1)) : null,
      temp_max: tempMax !== null ? Number(tempMax.toFixed(1)) : null,
      temp_min: tempMin !== null ? Number(tempMin.toFixed(1)) : null,
      precipitation: precip !== null ? Number(precip.toFixed(1)) : 0,
      soil_moisture: soilMoist !== null ? Number(soilMoist.toFixed(3)) : null,
      ndvi: ndviVal !== null ? Number(ndviVal.toFixed(2)) : null,
      evapotranspiration: et0 !== null ? Number(et0.toFixed(1)) : 0
    }
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Monitoramento e Indicadores Ambientais"
        description={`Propriedade #${propertyId} — Sincronização e séries temporais agroclimáticas via satélite e modelos biofísicos`}
        breadcrumbs={[
          { label: 'Propriedades', href: '/properties' },
          { label: `Propriedade #${propertyId}`, href: `/properties/${propertyId}` },
          { label: 'Ambiental' }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link to={`/properties/${propertyId}`}>
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Voltar à Propriedade
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              loading={syncing}
              leftIcon={<Satellite className="w-4 h-4" />}
              onClick={handleSync}
            >
              Sincronizar Dados da NASA
            </Button>
          </div>
        }
      />

      {/* Sync Status Banner */}
      {syncResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-emerald-800">{syncResult.message}</p>
            <p className="text-xs text-emerald-700 mt-1">
              Dias integrados: {syncResult.days_synced} | Fontes:{' '}
              {syncResult.sources?.join(', ') || 'NASA POWER, SRTM, FAO-56'}
            </p>
          </div>
          <button
            onClick={() => setSyncResult(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium ml-2"
          >
            Fechar
          </button>
        </div>
      )}

      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-900 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-red-800">Falha na sincronização</p>
            <p className="text-xs text-red-700 mt-0.5">{syncError}</p>
          </div>
          <button
            onClick={() => setSyncError(null)}
            className="text-xs text-red-600 hover:text-red-800 font-medium ml-2"
          >
            Fechar
          </button>
        </div>
      )}

      {/* SECTION 1: Sincronização & Fontes de Dados */}
      <Card noPadding className="overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border-slate-700">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
                <Satellite className="w-3.5 h-3.5" />
                Dados Oficiais de Sensoriamento Remoto
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Sincronização Agroclimática Integrada
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                O TerraViva se conecta diretamente às APIs científicas da NASA e órgãos internacionais para extrair histórico agroclimático diário da propriedade, sem invenção de dados ou estimativas fictícias.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                loading={syncing}
                leftIcon={<Satellite className="w-5 h-5" />}
                onClick={handleSync}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
              >
                {syncing ? 'Sincronizando com a NASA...' : 'Sincronizar Dados da NASA'}
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-6 border-t border-slate-700/60">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Sun className="w-4 h-4" /> NASA POWER
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Agroclimatologia diária: temperaturas, chuva e radiação solar.
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                <Droplets className="w-4 h-4" /> NASA SMAP
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Umidade volumétrica do solo em m³/m³ e detecção de secas.
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-lime-400 text-xs font-semibold">
                <Activity className="w-4 h-4" /> Landsat / MODIS
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Vigor vegetativo com índice NDVI de cobertura verde ativa.
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <Layers className="w-4 h-4" /> FAO-56 / Hargreaves
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Evapotranspiração de referência (ET0) biofísica validada.
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                <Mountain className="w-4 h-4" /> NASA SRTM
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Topografia real 30m, relevo, declividade e cota altimétrica.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Overview Summary (if available) */}
      {hasTimeline && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase">Precipitação Total</span>
              <CloudRain className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">
                {summary.precipitation_total_mm !== undefined
                  ? summary.precipitation_total_mm.toFixed(1)
                  : formattedTimeline.reduce((acc, curr) => acc + (curr.precipitation || 0), 0).toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">mm</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Acumulado no período ({dateRange} dias)</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase">Temp. Média</span>
              <Thermometer className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">
                {summary.temperature_mean_c !== undefined
                  ? summary.temperature_mean_c.toFixed(1)
                  : (
                      formattedTimeline.reduce((acc, curr) => acc + (curr.temp_mean || 0), 0) /
                      (formattedTimeline.filter((t) => t.temp_mean !== null).length || 1)
                    ).toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">°C</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Média aritmética diária</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase">Risco de Estiagem</span>
              <Droplets className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <Badge
                variant={
                  summary.drought_risk === 'ALTO'
                    ? 'danger'
                    : summary.drought_risk === 'MODERADO'
                    ? 'warning'
                    : 'success'
                }
              >
                {summary.drought_risk || 'Normal'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">Avaliação do balanço hídrico</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase">Observações</span>
              <Database className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{timeline.length}</span>
              <span className="text-xs text-slate-500">dias registrados</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Resolução temporal diária</p>
          </Card>
        </div>
      )}

      {/* SECTION 2: Série Temporal & Gráficos */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Série Temporal Agroclimática
            </h3>
            <p className="text-xs text-slate-500">
              Evolução contínua das variáveis biofísicas ao longo do tempo
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <span className="text-xs font-medium text-slate-500 px-2">Período:</span>
            {([30, 90, 180, 365] as DateRangeOption[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  dateRange === range
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 365 ? '1 Ano' : `${range}d`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-72 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        ) : error ? (
          <Card className="p-8 text-center border-red-200 bg-red-50">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-red-900">Erro ao carregar dados ambientais</h4>
            <p className="text-sm text-red-700 max-w-md mx-auto mt-1 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTimeseries}>
              Tentar Novamente
            </Button>
          </Card>
        ) : !hasTimeline ? (
          <Card className="p-10">
            <EmptyState
              icon={<Satellite className="w-10 h-10 text-emerald-600" />}
              title="Sincronize primeiro para ver os dados"
              description="Ainda não foram sincronizados registros meteorológicos e de satélite para esta propriedade. Clique no botão abaixo para buscar dados reais da NASA."
              action={{
                label: syncing ? 'Sincronizando...' : 'Sincronizar Dados da NASA Agora',
                onClick: handleSync
              }}
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Chart 1: Temperature Chart (LineChart with 3 lines) */}
            <Card
              title="Temperatura do Ar (°C)"
              actions={
                <span className="text-xs text-slate-500 font-normal">
                  Fonte: NASA POWER Diário (Temp. Média, Máxima e Mínima)
                </span>
              }
            >
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                    />
                    <YAxis
                      unit="°C"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs space-y-1">
                            <p className="font-semibold text-slate-800 border-b pb-1 mb-1">Data: {label}</p>
                            {payload.map((entry: any) => (
                              <div key={entry.name} className="flex items-center justify-between gap-4">
                                <span style={{ color: entry.color }} className="font-medium">
                                  {entry.name}:
                                </span>
                                <span className="font-bold text-slate-900">{entry.value} °C</span>
                              </div>
                            ))}
                          </div>
                        )
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="temp_max"
                      name="Temp. Máxima"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp_mean"
                      name="Temp. Média"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp_min"
                      name="Temp. Mínima"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 2: Precipitation Chart (BarChart) */}
              <Card
                title="Precipitação Pluviométrica Diária (mm)"
                actions={
                  <span className="text-xs text-slate-500 font-normal">
                    NASA POWER
                  </span>
                }
              >
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <YAxis
                        unit="mm"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(val: any) => [`${val} mm`, 'Chuva Diária']}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Bar
                        dataKey="precipitation"
                        name="Precipitação"
                        fill="#0284c7"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 3: Evapotranspiration Chart (BarChart) */}
              <Card
                title="Evapotranspiração de Referência - ET0 (mm)"
                actions={
                  <span className="text-xs text-slate-500 font-normal">
                    FAO-56 Hargreaves
                  </span>
                }
              >
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <YAxis
                        unit="mm"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(val: any) => [`${val} mm`, 'ET0 Demanda Hídrica']}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Bar
                        dataKey="evapotranspiration"
                        name="Evapotranspiração (ET0)"
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 4: NDVI Chart (AreaChart - Green fill) */}
              <Card
                title="Índice de Vegetação - NDVI"
                actions={
                  <span className="text-xs text-slate-500 font-normal">
                    Landsat / MODIS
                  </span>
                }
              >
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 1]}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(val: any) => [val !== null ? val : 'Indisponível', 'NDVI']}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="ndvi"
                        name="NDVI (Vigor)"
                        stroke="#16a34a"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#ndviGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 5: Soil Moisture Chart (AreaChart - Blue fill) */}
              <Card
                title="Umidade Volumétrica do Solo (m³/m³)"
                actions={
                  <span className="text-xs text-slate-500 font-normal">
                    NASA SMAP
                  </span>
                }
              >
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <YAxis
                        unit=" m³"
                        domain={[0, 'auto']}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(val: any) => [val !== null ? `${val} m³/m³` : 'Indisponível', 'Umidade']}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="soil_moisture"
                        name="Umidade do Solo"
                        stroke="#0284c7"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#moistureGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
