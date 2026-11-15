import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/common/Modal'
import { Input } from '../../../components/common/Input'
import { Select } from '../../../components/common/Select'
import { Button } from '../../../components/common/Button'
import { plotsApi } from '../../../api/plots'
import type { Plot, PlotCreate } from '../../../types'

interface PlotFormProps {
  propertyId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: (savedPlot: Plot) => void
  plot?: Plot | null
}

const SOIL_TYPES = [
  'Latossolo',
  'Argissolo',
  'Neossolo',
  'Gleissolo',
  'Cambissolo',
  'Nitossolo',
  'Planossolo',
  'Vertissolo',
  'Outros',
]

const SOIL_TEXTURES = ['Argilosa', 'Média', 'Arenosa', 'Muito Argilosa']

const WATER_RETENTION_OPTIONS = ['Alta', 'Média', 'Baixa']

const DRAINAGE_OPTIONS = ['Boa', 'Moderada', 'Ruim', 'Excessiva']

export function PlotForm({
  propertyId,
  isOpen,
  onClose,
  onSuccess,
  plot,
}: PlotFormProps) {
  const isEditing = !!plot

  const [formData, setFormData] = useState<PlotCreate>({
    property_id: propertyId,
    name: '',
    area_ha: 0,
    soil_type: 'Latossolo',
    soil_texture: 'Argilosa',
    ph: 6.0,
    organic_matter_pct: 3.0,
    water_retention_capacity: 'Média',
    drainage: 'Boa',
    slope_pct: 2.0,
    current_crop: '',
    irrigation_system: 'Nenhum',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (plot) {
      setFormData({
        property_id: propertyId,
        name: plot.name || '',
        area_ha: plot.area_ha || 0,
        soil_type: plot.soil_type || 'Latossolo',
        soil_texture: plot.soil_texture || 'Argilosa',
        ph: plot.ph ?? 6.0,
        organic_matter_pct: plot.organic_matter_pct ?? 3.0,
        water_retention_capacity: plot.water_retention_capacity || 'Média',
        drainage: plot.drainage || 'Boa',
        slope_pct: plot.slope_pct ?? 2.0,
        current_crop: plot.current_crop || '',
        irrigation_system: plot.irrigation_system || 'Nenhum',
      })
    } else {
      setFormData({
        property_id: propertyId,
        name: '',
        area_ha: 0,
        soil_type: 'Latossolo',
        soil_texture: 'Argilosa',
        ph: 6.0,
        organic_matter_pct: 3.0,
        water_retention_capacity: 'Média',
        drainage: 'Boa',
        slope_pct: 2.0,
        current_crop: '',
        irrigation_system: 'Nenhum',
      })
    }
    setErrors({})
    setApiError(null)
  }, [plot, propertyId, isOpen])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!formData.name.trim()) {
      errs.name = 'Nome do talhão é obrigatório'
    }

    if (formData.area_ha <= 0) {
      errs.area_ha = 'Área do talhão deve ser maior que zero'
    }

    if (formData.ph !== undefined && formData.ph !== null) {
      if (formData.ph < 3.5 || formData.ph > 8.5) {
        errs.ph = 'pH deve estar entre 3.5 e 8.5'
      }
    }

    if (formData.organic_matter_pct !== undefined && formData.organic_matter_pct !== null) {
      if (formData.organic_matter_pct < 0 || formData.organic_matter_pct > 100) {
        errs.organic_matter_pct = 'Matéria orgânica deve estar entre 0% e 100%'
      }
    }

    if (formData.slope_pct !== undefined && formData.slope_pct !== null) {
      if (formData.slope_pct < 0) {
        errs.slope_pct = 'Declividade deve ser maior ou igual a 0%'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      const payload: PlotCreate = {
        name: formData.name.trim(),
        area_ha: Number(formData.area_ha),
        soil_type: formData.soil_type || undefined,
        soil_texture: formData.soil_texture || undefined,
        ph: formData.ph !== undefined && formData.ph !== null ? Number(formData.ph) : undefined,
        organic_matter_pct:
          formData.organic_matter_pct !== undefined && formData.organic_matter_pct !== null
            ? Number(formData.organic_matter_pct)
            : undefined,
        water_retention_capacity: formData.water_retention_capacity || undefined,
        drainage: formData.drainage || undefined,
        slope_pct:
          formData.slope_pct !== undefined && formData.slope_pct !== null
            ? Number(formData.slope_pct)
            : undefined,
        current_crop: formData.current_crop?.trim() || undefined,
        irrigation_system: formData.irrigation_system?.trim() || undefined,
      }

      let saved: Plot
      if (isEditing && plot) {
        saved = await plotsApi.update(propertyId, plot.id, payload)
      } else {
        saved = await plotsApi.create(payload, propertyId)
      }

      onSuccess(saved)
      onClose()
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Erro ao salvar talhão. Verifique os dados inseridos.'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Talhão' : 'Novo Talhão'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nome do Talhão"
            required
            placeholder="Ex: Talhão 01 - Norte"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <Input
            label="Área (ha)"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={formData.area_ha || ''}
            onChange={(e) =>
              setFormData({ ...formData, area_ha: parseFloat(e.target.value) || 0 })
            }
            error={errors.area_ha}
            hint="Em hectares"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Cultura Atual"
            placeholder="Ex: Soja, Milho, Café, Pastagem..."
            value={formData.current_crop || ''}
            onChange={(e) =>
              setFormData({ ...formData, current_crop: e.target.value })
            }
            hint="Deixe vazio se estiver em pousio"
          />

          <Input
            label="Sistema de Irrigação"
            placeholder="Ex: Pivô Central, Gotejamento, Sequeiro"
            value={formData.irrigation_system || ''}
            onChange={(e) =>
              setFormData({ ...formData, irrigation_system: e.target.value })
            }
          />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Características do Solo e Relevo
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo de Solo"
              value={formData.soil_type || ''}
              onChange={(e) =>
                setFormData({ ...formData, soil_type: e.target.value })
              }
            >
              {SOIL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>

            <Select
              label="Textura do Solo"
              value={formData.soil_texture || ''}
              onChange={(e) =>
                setFormData({ ...formData, soil_texture: e.target.value })
              }
            >
              {SOIL_TEXTURES.map((texture) => (
                <option key={texture} value={texture}>
                  {texture}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Input
              label="pH do Solo"
              type="number"
              step="0.1"
              min="3.5"
              max="8.5"
              placeholder="6.0"
              value={formData.ph ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ph: e.target.value === '' ? undefined : parseFloat(e.target.value),
                })
              }
              error={errors.ph}
              hint="3.5 a 8.5"
            />

            <Input
              label="Matéria Orgânica (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="3.0"
              value={formData.organic_matter_pct ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  organic_matter_pct:
                    e.target.value === '' ? undefined : parseFloat(e.target.value),
                })
              }
              error={errors.organic_matter_pct}
              hint="Ex: 3.5%"
            />

            <Input
              label="Declividade (%)"
              type="number"
              step="0.1"
              min="0"
              placeholder="2.0"
              value={formData.slope_pct ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slope_pct:
                    e.target.value === '' ? undefined : parseFloat(e.target.value),
                })
              }
              error={errors.slope_pct}
              hint="Inclinação do terreno"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Select
              label="Retenção de Água"
              value={formData.water_retention_capacity || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  water_retention_capacity: e.target.value,
                })
              }
            >
              {WATER_RETENTION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>

            <Select
              label="Drenagem"
              value={formData.drainage || ''}
              onChange={(e) =>
                setFormData({ ...formData, drainage: e.target.value })
              }
            >
              {DRAINAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Talhão'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
