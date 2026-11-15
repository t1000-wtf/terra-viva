import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { SkeletonCard } from '../../components/common/Skeleton'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { PropertyForm } from './components/PropertyForm'
import { propertiesApi } from '../../api/properties'
import { formatArea, formatDate } from '../../utils/format'
import type { Property } from '../../types'
import {
  Plus,
  MapPin,
  Calendar,
  ArrowRight,
  Pencil,
  Trash2,
  Building2,
  CheckCircle,
} from 'lucide-react'

export function PropertiesPage() {
  const navigate = useNavigate()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchProperties = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await propertiesApi.list()
      setProperties(data)
    } catch (err: any) {
      console.error('Erro ao carregar propriedades:', err)
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Não foi possível carregar suas propriedades rurais.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const handleOpenCreate = () => {
    setEditingProperty(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (prop: Property) => {
    setEditingProperty(prop)
    setIsFormOpen(true)
  }

  const handleFormSuccess = (saved: Property) => {
    if (editingProperty) {
      setSuccessMessage(`Propriedade "${saved.name}" atualizada com sucesso!`)
    } else {
      setSuccessMessage(`Propriedade "${saved.name}" cadastrada com sucesso!`)
    }
    setTimeout(() => setSuccessMessage(null), 4000)
    fetchProperties()
  }

  const handleDelete = async () => {
    if (!deletingProperty) return

    setIsDeleting(true)
    try {
      await propertiesApi.delete(deletingProperty.id)
      setSuccessMessage(`Propriedade "${deletingProperty.name}" removida com sucesso.`)
      setTimeout(() => setSuccessMessage(null), 4000)
      setDeletingProperty(null)
      fetchProperties()
    } catch (err: any) {
      console.error('Erro ao excluir propriedade:', err)
      alert(
        err.response?.data?.detail ||
          'Erro ao excluir propriedade. Tente novamente mais tarde.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Propriedades"
        description="Gerencie seus imóveis rurais, visualize talhões e acesse diagnósticos agronômicos."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Propriedades' },
        ]}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Nova Propriedade
          </Button>
        }
      />

      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <Button size="xs" variant="outline" onClick={fetchProperties}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && properties.length === 0 && (
        <EmptyState
          icon={<Building2 className="w-8 h-8 text-slate-400" />}
          title="Nenhuma propriedade cadastrada"
          description="Adicione sua primeira propriedade rural para começar a cadastrar talhões, acompanhar indicadores e receber recomendações sustentáveis."
          action={{
            label: 'Adicionar Propriedade',
            onClick: handleOpenCreate,
          }}
        />
      )}

      {/* Property Cards Grid */}
      {!loading && properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const totalArea = property.total_area_ha || 0
            const cultArea = property.cultivated_area_ha || 0
            const cultPercent =
              totalArea > 0 ? Math.min(100, Math.round((cultArea / totalArea) * 100)) : 0

            return (
              <Card
                key={property.id}
                hoverable
                className="flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-lg truncate">
                        {property.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {property.municipality || property.city || '—'}, {property.state}
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">
                      Ativa
                    </Badge>
                  </div>

                  {property.description && (
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  {/* Areas Metrics */}
                  <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                        Área Total
                      </p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">
                        {formatArea(totalArea)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                        Cultivada
                      </p>
                      <p className="text-base font-bold text-emerald-700 mt-0.5">
                        {formatArea(cultArea)}
                      </p>
                    </div>

                    {cultArea > 0 && (
                      <div className="col-span-2 pt-1 border-t border-slate-200/60">
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Aproveitamento</span>
                          <span className="font-medium text-slate-700">{cultPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${cultPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date badge */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Cadastrada em {formatDate(property.created_at)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="primary"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => navigate(`/properties/${property.id}`)}
                  >
                    Ver Detalhes
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(property)}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4 text-slate-600" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeletingProperty(property)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Property Form Modal (Create / Edit) */}
      <PropertyForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingProperty(null)
        }}
        onSuccess={handleFormSuccess}
        property={editingProperty}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProperty}
        onClose={() => setDeletingProperty(null)}
        onConfirm={handleDelete}
        title="Excluir Propriedade"
        message={`Tem certeza que deseja excluir a propriedade "${deletingProperty?.name}"? Esta ação removerá também todos os seus talhões e históricos vinculados.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  )
}
export default PropertiesPage
