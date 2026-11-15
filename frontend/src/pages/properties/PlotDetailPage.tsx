import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Badge } from '../../components/common/Badge'
import { Skeleton } from '../../components/common/Skeleton'
import { PlotForm } from './components/PlotForm'
import { propertiesApi } from '../../api/properties'
import { plotsApi } from '../../api/plots'
import { formatArea } from '../../utils/format'
import type { Property, Plot } from '../../types'
import {
  Sprout,
  Pencil,
  ArrowLeft,
  Layers,
  Sparkles,
  Droplets,
  TrendingDown,
  History,
  Lightbulb,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'

export function PlotDetailPage() {
  const { propertyId, plotId } = useParams<{ propertyId: string; plotId: string }>()
  const navigate = useNavigate()
  const propId = Number(propertyId)
  const pId = Number(plotId)

  const [plot, setPlot] = useState<Plot | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchData = async () => {
    if (!propId || !pId) {
      setError('Identificadores de propriedade ou talhão inválidos.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [plotData, propData] = await Promise.all([
        plotsApi.get(propId, pId),
        propertiesApi.get(propId).catch(() => null),
      ])
      setPlot(plotData)
      setProperty(propData)
    } catch (err: any) {
      console.error('Erro ao carregar detalhes do talhão:', err)
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Não foi possível encontrar as informações deste talhão.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [propertyId, plotId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !plot) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Talhão não encontrado</h3>
        <p className="text-sm text-slate-500 mb-4">{error || 'Talhão inexistente.'}</p>
        <Button
          variant="primary"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(`/properties/${propertyId}`)}
        >
          Voltar para a Propriedade
        </Button>
      </div>
    )
  }

  // Interpret pH scale
  const getPhClassification = (ph?: number) => {
    if (ph === undefined || ph === null) return 'Não informado'
    if (ph < 5.0) return 'Fortemente Ácido'
    if (ph <= 5.9) return 'Moderadamente Ácido'
    if (ph <= 6.8) return 'Ideal / Neutro'
    return 'Alcalino'
  }

  // Interpret slope
  const getSlopeClassification = (slope?: number) => {
    if (slope === undefined || slope === null) return 'Não informado'
    if (slope <= 3) return 'Plano'
    if (slope <= 8) return 'Suave-ondulado'
    if (slope <= 20) return 'Moderadamente ondulado'
    if (slope <= 45) return 'Ondulado a Forte-ondulado'
    return 'Montanhoso'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={plot.name}
        description={`Talhão pertencente a ${property ? property.name : 'sua propriedade'}.`}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Propriedades', href: '/properties' },
          {
            label: property ? property.name : 'Propriedade',
            href: `/properties/${propId}`,
          },
          { label: plot.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Pencil className="w-4 h-4" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Editar Talhão
            </Button>
          </div>
        }
      />

      {notification && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header Card */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Sprout className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{plot.name}</h2>
                <Badge variant="success" size="md">
                  {formatArea(plot.area_ha)}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Propriedade: <Link to={`/properties/${propId}`} className="text-emerald-700 font-medium hover:underline">{property?.name || 'Ver propriedade'}</Link>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {plot.current_crop ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Cultura Atual: <strong>{plot.current_crop}</strong></span>
              </div>
            ) : (
              <Badge variant="default" size="md">
                Em Pousio / Sem cultura ativa
              </Badge>
            )}
          </div>
        </div>

        {/* Highlight Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
          {/* History link card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-emerald-500 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Histórico Agrícola</h4>
                <p className="text-xs text-slate-500">Safras anteriores, custos e produtividades</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => navigate(`/plots/${plot.id}/history`)}
            >
              Acessar
            </Button>
          </div>

          {/* Recommendations link card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-amber-500 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Recomendações de Culturas</h4>
                <p className="text-xs text-slate-500">Planos agronômicos sugeridos pela IA</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => navigate(`/recommendations/${plot.id}`)}
            >
              Ver Planos
            </Button>
          </div>
        </div>
      </Card>

      {/* Soil and Agronomic Characteristics */}
      <Card title="Características do Solo e Relevo">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold uppercase">Tipo de Solo</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {plot.soil_type || 'Não informado'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Classificação SiBCS</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold uppercase">Textura</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {plot.soil_texture || 'Não informada'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Proporção argila/areia</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase">pH do Solo</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {plot.ph !== undefined && plot.ph !== null ? plot.ph : '—'}
            </p>
            <p className="text-xs text-amber-700 mt-1 font-medium">
              {getPhClassification(plot.ph)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold uppercase">Matéria Orgânica</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {plot.organic_matter_pct !== undefined && plot.organic_matter_pct !== null
                ? `${plot.organic_matter_pct}%`
                : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Teor no solo</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold uppercase">Retenção de Água</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {plot.water_retention_capacity || 'Não informada'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Capacidade de campo</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Droplets className="w-4 h-4 text-cyan-600" />
              <span className="text-xs font-semibold uppercase">Drenagem</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {plot.drainage || 'Não informada'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Velocidade de infiltração</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold uppercase">Declividade</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {plot.slope_pct !== undefined && plot.slope_pct !== null
                ? `${plot.slope_pct}%`
                : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {getSlopeClassification(plot.slope_pct)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Droplets className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-semibold uppercase">Irrigação</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {plot.irrigation_system || 'Sequeiro / Nenhum'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Sistema adotado</p>
          </div>
        </div>
      </Card>

      {/* Edit Plot Modal */}
      <PlotForm
        propertyId={propId}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => {
          setPlot(updated)
          showNotification('Talhão atualizado com sucesso!')
        }}
        plot={plot}
      />
    </div>
  )
}
export default PlotDetailPage
