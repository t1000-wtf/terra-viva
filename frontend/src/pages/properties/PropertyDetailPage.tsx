import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Badge } from '../../components/common/Badge'
import { Skeleton, SkeletonCard } from '../../components/common/Skeleton'
import { EmptyState } from '../../components/common/EmptyState'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { PropertyForm } from './components/PropertyForm'
import { PlotForm } from './components/PlotForm'
import { PlotCard } from './components/PlotCard'
import { propertiesApi } from '../../api/properties'
import { plotsApi } from '../../api/plots'
import { formatArea, formatDate } from '../../utils/format'
import type { Property, Plot } from '../../types'
import {
  MapPin,
  Pencil,
  Plus,
  CloudSun,
  Users,
  Activity,
  Layers,
  CheckCircle,
  Calendar,
} from 'lucide-react'

export function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const navigate = useNavigate()
  const propId = Number(propertyId)

  // Property state
  const [property, setProperty] = useState<Property | null>(null)
  const [loadingProperty, setLoadingProperty] = useState(true)
  const [propertyError, setPropertyError] = useState<string | null>(null)

  // Plots state
  const [plots, setPlots] = useState<Plot[]>([])
  const [loadingPlots, setLoadingPlots] = useState(true)
  const [plotsError, setPlotsError] = useState<string | null>(null)

  // Modals state
  const [isEditPropertyOpen, setIsEditPropertyOpen] = useState(false)
  const [isPlotFormOpen, setIsPlotFormOpen] = useState(false)
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null)
  const [deletingPlot, setDeletingPlot] = useState<Plot | null>(null)
  const [isDeletingPlot, setIsDeletingPlot] = useState(false)

  const [notification, setNotification] = useState<string | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  // Fetch property details
  const fetchProperty = async () => {
    if (!propId || isNaN(propId)) {
      setPropertyError('ID de propriedade inválido.')
      setLoadingProperty(false)
      return
    }

    setLoadingProperty(true)
    setPropertyError(null)
    try {
      const data = await propertiesApi.get(propId)
      setProperty(data)
    } catch (err: any) {
      console.error('Erro ao buscar propriedade:', err)
      setPropertyError(
        err.response?.data?.detail ||
          err.message ||
          'Não foi possível encontrar a propriedade solicitada.'
      )
    } finally {
      setLoadingProperty(false)
    }
  }

  // Fetch plots
  const fetchPlots = async () => {
    if (!propId || isNaN(propId)) return

    setLoadingPlots(true)
    setPlotsError(null)
    try {
      const data = await plotsApi.list(propId)
      setPlots(data)
    } catch (err: any) {
      console.error('Erro ao carregar talhões:', err)
      setPlotsError(
        err.response?.data?.detail ||
          err.message ||
          'Não foi possível carregar os talhões desta propriedade.'
      )
    } finally {
      setLoadingPlots(false)
    }
  }

  useEffect(() => {
    fetchProperty()
    fetchPlots()
  }, [propertyId])

  // Handlers for plot actions
  const handleOpenCreatePlot = () => {
    setEditingPlot(null)
    setIsPlotFormOpen(true)
  }

  const handleOpenEditPlot = (plot: Plot) => {
    setEditingPlot(plot)
    setIsPlotFormOpen(true)
  }

  const handlePlotSuccess = (saved: Plot) => {
    if (editingPlot) {
      showNotification(`Talhão "${saved.name}" atualizado com sucesso!`)
    } else {
      showNotification(`Talhão "${saved.name}" cadastrado com sucesso!`)
    }
    fetchPlots()
  }

  const handleDeletePlot = async () => {
    if (!deletingPlot) return

    setIsDeletingPlot(true)
    try {
      await plotsApi.delete(propId, deletingPlot.id)
      showNotification(`Talhão "${deletingPlot.name}" excluído com sucesso.`)
      setDeletingPlot(null)
      fetchPlots()
    } catch (err: any) {
      console.error('Erro ao excluir talhão:', err)
      alert(err.response?.data?.detail || 'Erro ao excluir talhão.')
    } finally {
      setIsDeletingPlot(false)
    }
  }

  if (loadingProperty) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (propertyError || !property) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-red-600 mb-2">
          Propriedade não encontrada
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {propertyError || 'O registro que você procura não existe ou você não possui acesso.'}
        </p>
        <Button variant="primary" onClick={() => navigate('/properties')}>
          Voltar para Propriedades
        </Button>
      </div>
    )
  }

  const totalArea = property.total_area_ha || 0
  const cultArea = property.cultivated_area_ha || 0
  const plotsTotalArea = plots.reduce((acc, p) => acc + (p.area_ha || 0), 0)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={property.name}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Propriedades', href: '/properties' },
          { label: property.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Pencil className="w-4 h-4" />}
              onClick={() => setIsEditPropertyOpen(true)}
            >
              Editar Propriedade
            </Button>
          </div>
        }
      />

      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Quick Access to Module Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate(`/environmental/${property.id}`)}
          className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Dados Ambientais</h4>
            <p className="text-xs text-slate-500">Clima, solo e bioma</p>
          </div>
        </button>

        <button
          onClick={() => navigate(`/social/${property.id}`)}
          className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Indicadores Sociais</h4>
            <p className="text-xs text-slate-500">Comunidade e mão de obra</p>
          </div>
        </button>

        <button
          onClick={() => navigate(`/diagnostics/${property.id}`)}
          className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-purple-500 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Diagnóstico Integrado</h4>
            <p className="text-xs text-slate-500">Alertas e saúde da propriedade</p>
          </div>
        </button>
      </div>

      {/* Property Overview Card */}
      <Card>
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{property.name}</h2>
                  <Badge variant="success" size="sm">
                    {property.state}
                  </Badge>
                  <Badge variant="default" size="sm">
                    {property.municipality || property.city}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Localização: {property.municipality || property.city}, {property.state} — {property.country || 'Brasil'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>Cadastrada em {formatDate(property.created_at)}</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Área Total
              </p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatArea(totalArea)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Área Cultivada
              </p>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                {formatArea(cultArea)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Latitude
              </p>
              <p className="text-base font-semibold text-slate-800 mt-1">
                {property.latitude?.toFixed(5) || '—'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Longitude
              </p>
              <p className="text-base font-semibold text-slate-800 mt-1">
                {property.longitude?.toFixed(5) || '—'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Código IBGE
              </p>
              <p className="text-base font-semibold text-slate-800 mt-1">
                {property.ibge_code || 'Auto-detectado'}
              </p>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Descrição da Propriedade
              </h4>
              <p className="text-sm text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {property.description}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Plots Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Talhões da Propriedade
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {plots.length} {plots.length === 1 ? 'talhão cadastrado' : 'talhões cadastrados'} • Total demarcado: {formatArea(plotsTotalArea)}
            </p>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreatePlot}
          >
            Novo Talhão
          </Button>
        </div>

        {plotsError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {plotsError}
          </div>
        )}

        {/* Plots Loading Skeleton */}
        {loadingPlots && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Empty State Plots */}
        {!loadingPlots && !plotsError && plots.length === 0 && (
          <EmptyState
            icon={<Layers className="w-8 h-8 text-slate-400" />}
            title="Nenhum talhão cadastrado"
            description="Cadastre as divisões e áreas de plantio desta propriedade para receber recomendações agronômicas precisas baseadas nas características do solo."
            action={{
              label: 'Cadastrar Primeiro Talhão',
              onClick: handleOpenCreatePlot,
            }}
          />
        )}

        {/* Plots Grid */}
        {!loadingPlots && plots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plots.map((plot) => (
              <PlotCard
                key={plot.id}
                plot={plot}
                propertyId={property.id}
                onEdit={handleOpenEditPlot}
                onDelete={(p) => setDeletingPlot(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Property Edit Modal */}
      <PropertyForm
        isOpen={isEditPropertyOpen}
        onClose={() => setIsEditPropertyOpen(false)}
        onSuccess={(updated) => {
          setProperty(updated)
          showNotification('Propriedade atualizada com sucesso!')
        }}
        property={property}
      />

      {/* Plot Create / Edit Modal */}
      <PlotForm
        propertyId={property.id}
        isOpen={isPlotFormOpen}
        onClose={() => {
          setIsPlotFormOpen(false)
          setEditingPlot(null)
        }}
        onSuccess={handlePlotSuccess}
        plot={editingPlot}
      />

      {/* Plot Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingPlot}
        onClose={() => setDeletingPlot(null)}
        onConfirm={handleDeletePlot}
        title="Excluir Talhão"
        message={`Tem certeza que deseja excluir o talhão "${deletingPlot?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={isDeletingPlot}
      />
    </div>
  )
}
export default PropertyDetailPage
