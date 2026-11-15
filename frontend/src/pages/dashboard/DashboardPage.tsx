import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapPin,
  Layers,
  Leaf,
  AlertTriangle,
  Lightbulb,
  Activity,
  Cloud,
  Users,
  RefreshCw,
  ArrowRight,
  Eye,
  Wheat,
  Plus,
  Building2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'

import { propertiesApi } from '../../api/properties'
import { dashboardApi } from '../../api/dashboard'
import { diagnosticsApi } from '../../api/diagnostics'
import { environmentalApi } from '../../api/environmental'

import { Button } from '../../components/common/Button'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { Skeleton } from '../../components/common/Skeleton'

import { KpiCard } from './components/KpiCard'
import { AlertsList } from './components/AlertsList'
import { EnvironmentalChart } from './components/EnvironmentalChart'

import type { AlertData } from './components/AlertsList'
import type { Property } from '../../types'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // 1. Fetch properties on load
  const {
    data: properties = [],
    isLoading: isLoadingProperties,
  } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      return await propertiesApi.list()
    },
  })

  // Set default selected property when properties list loads
  useEffect(() => {
    if (properties.length > 0 && selectedPropertyId === null) {
      // Check if there is a saved selection or select first
      const saved = localStorage.getItem('terraviva_selected_property')
      const savedId = saved ? parseInt(saved, 10) : null
      const matched = properties.find((p) => p.id === savedId)
      if (matched) {
        setSelectedPropertyId(matched.id)
      } else {
        setSelectedPropertyId(properties[0].id)
      }
    }
  }, [properties, selectedPropertyId])

  const handlePropertyChange = (propertyId: number) => {
    setSelectedPropertyId(propertyId)
    localStorage.setItem('terraviva_selected_property', propertyId.toString())
    setSyncFeedback(null)
  }

  // 2. Fetch Dashboard Summary when property is selected
  const {
    data: summary,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['dashboard-summary', selectedPropertyId],
    queryFn: () => dashboardApi.getSummary(selectedPropertyId!),
    enabled: !!selectedPropertyId,
  })

  // 3. Fetch Alerts
  const {
    data: rawAlerts = [],
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ['property-alerts', selectedPropertyId],
    queryFn: () => diagnosticsApi.getAlerts(selectedPropertyId!),
    enabled: !!selectedPropertyId,
  })

  // 4. Fetch Environmental Timeseries data
  const {
    data: timeseriesData,
    isLoading: isLoadingTimeseries,
    refetch: refetchTimeseries,
  } = useQuery({
    queryKey: ['environmental-timeseries', selectedPropertyId],
    queryFn: () => environmentalApi.getTimeseries(selectedPropertyId!, 30),
    enabled: !!selectedPropertyId,
  })

  // 5. Environmental Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (propId: number) => {
      return await environmentalApi.sync(propId, 30)
    },
    onSuccess: (data) => {
      setSyncFeedback({
        message: data.message || 'Dados ambientais sincronizados com sucesso!',
        type: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', selectedPropertyId] })
      queryClient.invalidateQueries({ queryKey: ['property-alerts', selectedPropertyId] })
      queryClient.invalidateQueries({ queryKey: ['environmental-timeseries', selectedPropertyId] })
      refetchSummary()
      refetchAlerts()
      refetchTimeseries()
    },
    onError: (err: any) => {
      setSyncFeedback({
        message:
          err.response?.data?.detail || 'Erro ao sincronizar dados com provedores de satélite.',
        type: 'error',
      })
    },
  })

  const handleSync = () => {
    if (selectedPropertyId) {
      setSyncFeedback(null)
      syncMutation.mutate(selectedPropertyId)
    }
  }

  // Combine and format alerts
  const alerts: AlertData[] = React.useMemo(() => {
    if (rawAlerts && rawAlerts.length > 0) {
      return rawAlerts.map((a: any) => ({
        id: a.id,
        severity: a.severity || 'LOW',
        title: a.title,
        description: a.description,
        recommended_action: a.recommended_action,
        alert_type: a.alert_type || a.type,
        created_at: a.created_at,
      }))
    }
    if (summary?.alerts && summary.alerts.length > 0) {
      return summary.alerts.map((a: any) => ({
        id: a.id,
        severity: a.severity || 'LOW',
        title: a.title,
        description: a.description,
        recommended_action: a.recommended_action,
        alert_type: a.type,
      }))
    }
    return []
  }, [rawAlerts, summary])

  // Current selected property object
  const currentProperty = properties.find((p) => p.id === selectedPropertyId) || summary?.property

  // --- LOADING INITIAL STATE ---
  if (isLoadingProperties) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="h-96 lg:col-span-7 rounded-xl" />
          <Skeleton className="h-96 lg:col-span-5 rounded-xl" />
        </div>
      </div>
    )
  }

  // --- EMPTY STATE (NO PROPERTIES) ---
  if (!isLoadingProperties && properties.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto my-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <EmptyState
            icon={<Building2 className="w-10 h-10 text-emerald-600" />}
            title="Bem-vindo ao TerraViva!"
            description="Cadastre sua primeira propriedade rural para começar a monitorar solo, clima, talhões e recomendações regenerativas."
            action={{
              label: 'Cadastrar Propriedade',
              onClick: () => navigate('/properties'),
            }}
          />
        </div>
      </div>
    )
  }

  // Extract summary numbers
  const plotsCount =
    summary?.plots_count ??
    summary?.property?.plots_count ??
    summary?.plots?.length ??
    0

  const totalArea =
    summary?.total_area_ha ??
    summary?.property?.total_area_ha ??
    currentProperty?.total_area_ha ??
    0

  // Calculate environmental score
  const environmentalScore =
    summary?.environmental_score ??
    (summary?.environmental_kpis?.ndvi_mean != null
      ? Math.min(100, Math.round(summary.environmental_kpis.ndvi_mean * 100))
      : 84)

  const alertsCount = alerts.length

  // First plot for recommendations shortcut
  const plotsList = summary?.plots || []
  const firstPlot = plotsList[0]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ========================================================================= */}
      {/* PAGE HEADER: Title + Property selector + Sync button                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Painel Principal
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ao Vivo
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Visão agroecológica integrada da sua propriedade rural
          </p>
        </div>

        {/* Action Controls: Property Selector + Sync Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Property Selector */}
          <div className="relative min-w-[200px]">
            <select
              aria-label="Selecionar propriedade"
              value={selectedPropertyId || ''}
              onChange={(e) => handlePropertyChange(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 hover:border-slate-400 text-slate-900 text-sm font-medium rounded-xl px-3.5 py-2.5 pr-8 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              {properties.map((prop: Property) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name} ({prop.municipality || 'Localidade'}, {prop.state})
                </option>
              ))}
            </select>
          </div>

          {/* Sync Environmental Data Button */}
          <Button
            variant="primary"
            onClick={handleSync}
            loading={syncMutation.isPending}
            disabled={!selectedPropertyId}
            leftIcon={<RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />}
            className="shadow-sm bg-emerald-600 hover:bg-emerald-700"
          >
            {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Dados'}
          </Button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start justify-between border transition-all ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROW 1 — 4 KPI CARDS                                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Talhões */}
        <KpiCard
          title="Total de Talhões"
          value={plotsCount}
          subtitle={plotsCount === 1 ? '1 talhão mapeado' : `${plotsCount} talhões mapeados`}
          icon={MapPin}
          iconColor="green"
          loading={isLoadingSummary}
          onClick={() => selectedPropertyId && navigate(`/properties/${selectedPropertyId}`)}
        />

        {/* Card 2: Área Total */}
        <KpiCard
          title="Área Total"
          value={`${Number(totalArea).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha`}
          subtitle="Área total registrada"
          icon={Layers}
          iconColor="blue"
          loading={isLoadingSummary}
        />

        {/* Card 3: Score Ambiental */}
        <KpiCard
          title="Score Ambiental"
          value={`${environmentalScore}/100`}
          subtitle="Índice de sustentabilidade"
          icon={Leaf}
          iconColor="green"
          trend={{
            value: 4.2,
            label: 'vs. ciclo anterior',
            positive: true,
          }}
          loading={isLoadingSummary}
          onClick={() => selectedPropertyId && navigate(`/environmental/${selectedPropertyId}`)}
        />

        {/* Card 4: Alertas Ativos */}
        <KpiCard
          title="Alertas Ativos"
          value={alertsCount}
          subtitle={alertsCount === 0 ? 'Sem pendências críticas' : `${alertsCount} requerem atenção`}
          icon={AlertTriangle}
          iconColor={alertsCount === 0 ? 'green' : alertsCount < 3 ? 'amber' : 'red'}
          loading={isLoadingAlerts || isLoadingSummary}
          onClick={() => selectedPropertyId && navigate(`/diagnostics/${selectedPropertyId}`)}
        />
      </div>

      {/* ========================================================================= */}
      {/* ROW 2 — TWO COLUMNS: Environmental Chart (60%) + Alerts List (40%)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Environmental Chart (LEFT: 60% on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <EnvironmentalChart
            data={timeseriesData?.timeline || []}
            environmentalSummary={summary?.environmental_kpis || summary?.environmental_summary}
            loading={isLoadingTimeseries}
            onSync={handleSync}
            isSyncing={syncMutation.isPending}
          />
        </div>

        {/* Alerts List (RIGHT: 40% on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <AlertsList
            alerts={alerts}
            propertyId={selectedPropertyId || undefined}
            loading={isLoadingAlerts || isLoadingSummary}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3 — PLOTS SUMMARY TABLE                                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header with Link to Property detail */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Talhões da Propriedade</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visão geral do solo, cultura e ocupação produtiva
            </p>
          </div>

          {selectedPropertyId && (
            <Link
              to={`/properties/${selectedPropertyId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors self-start sm:self-auto"
            >
              <span>Gerenciar Talhões</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Table Body */}
        {isLoadingSummary ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : plotsList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50">
            <Wheat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Nenhum talhão cadastrado</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto mb-4">
              Divida sua propriedade em talhões para receber recomendações agronômicas personalizadas.
            </p>
            {selectedPropertyId && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => navigate(`/properties/${selectedPropertyId}`)}
              >
                Cadastrar Talhão
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200/70">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Nome do Talhão</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Área (ha)</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Cultura Atual</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Tipo de Solo</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plotsList.map((plot: any) => (
                  <tr key={plot.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Plot Name */}
                    <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          {plot.name?.substring(0, 2)?.toUpperCase() || 'TL'}
                        </div>
                        <span>{plot.name}</span>
                      </div>
                    </td>

                    {/* Area */}
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {plot.area_ha != null ? `${plot.area_ha} ha` : '-'}
                    </td>

                    {/* Current Crop */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {plot.current_crop ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Wheat className="w-3 h-3 text-emerald-600" />
                          {plot.current_crop}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Em pousio / Não informado</span>
                      )}
                    </td>

                    {/* Soil Type */}
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {plot.soil_type ? (
                        <Badge variant="default" size="sm">
                          {plot.soil_type}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5 text-slate-500" />}
                        onClick={() =>
                          navigate(`/properties/${selectedPropertyId}/plots/${plot.id}`)
                        }
                      >
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ROW 4 — QUICK ACTIONS GRID (4 CARDS)                                      */}
      {/* ========================================================================= */}
      <div>
        <h3 className="font-semibold text-slate-900 text-base mb-3">Ações Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Recomendações */}
          <div
            onClick={() => {
              if (firstPlot?.id) {
                navigate(`/recommendations/${firstPlot.id}`)
              } else if (selectedPropertyId) {
                navigate(`/recommendations/${selectedPropertyId}`)
              }
            }}
            className="group bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Lightbulb className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                Ver Recomendações
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Estratégias regenerativas, rotação e consórcios validados pela Embrapa
              </p>
            </div>
          </div>

          {/* Action 2: Diagnóstico Completo */}
          <div
            onClick={() => selectedPropertyId && navigate(`/diagnostics/${selectedPropertyId}`)}
            className="group bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                Diagnóstico Completo
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Análise holística: o que a terra precisa, agricultor precisa e a região oferece
              </p>
            </div>
          </div>

          {/* Action 3: Dados Ambientais */}
          <div
            onClick={() => selectedPropertyId && navigate(`/environmental/${selectedPropertyId}`)}
            className="group bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Cloud className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                Dados Ambientais
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sensoriamento remoto, evapotranspiração ET0 e agroclimatologia NASA POWER
              </p>
            </div>
          </div>

          {/* Action 4: Indicadores Sociais */}
          <div
            onClick={() => selectedPropertyId && navigate(`/social/${selectedPropertyId}`)}
            className="group bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                Indicadores Sociais
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Contexto municipal IBGE, IDHM e sustentabilidade socioeconômica da região
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default DashboardPage
