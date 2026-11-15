import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/common/Modal'
import { Input } from '../../../components/common/Input'
import { Select } from '../../../components/common/Select'
import { Textarea } from '../../../components/common/Textarea'
import { Button } from '../../../components/common/Button'
import { propertiesApi } from '../../../api/properties'
import type { Property, PropertyCreate } from '../../../types'

interface PropertyFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (savedProperty: Property) => void
  property?: Property | null
}

const BRAZILIAN_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
]

export function PropertyForm({
  isOpen,
  onClose,
  onSuccess,
  property,
}: PropertyFormProps) {
  const isEditing = !!property

  const [formData, setFormData] = useState<PropertyCreate>({
    name: '',
    description: '',
    total_area_ha: 0,
    cultivated_area_ha: 0,
    country: 'Brasil',
    state: 'SP',
    municipality: '',
    latitude: 0,
    longitude: 0,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        description: property.description || '',
        total_area_ha: property.total_area_ha || 0,
        cultivated_area_ha: property.cultivated_area_ha ?? 0,
        country: property.country || 'Brasil',
        state: property.state || 'SP',
        municipality: property.municipality || property.city || '',
        latitude: property.latitude ?? 0,
        longitude: property.longitude ?? 0,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        total_area_ha: 0,
        cultivated_area_ha: 0,
        country: 'Brasil',
        state: 'SP',
        municipality: '',
        latitude: -22.9,
        longitude: -47.06,
      })
    }
    setErrors({})
    setApiError(null)
  }, [property, isOpen])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!formData.name.trim()) {
      errs.name = 'Nome da propriedade é obrigatório'
    }

    if (formData.total_area_ha <= 0) {
      errs.total_area_ha = 'Área total deve ser maior que zero'
    }

    if (
      formData.cultivated_area_ha !== undefined &&
      formData.cultivated_area_ha > formData.total_area_ha
    ) {
      errs.cultivated_area_ha = 'Área cultivada não pode ser maior que a área total'
    }

    if (!formData.state) {
      errs.state = 'Estado é obrigatório'
    }

    if (!formData.municipality.trim()) {
      errs.municipality = 'Município é obrigatório'
    }

    if (formData.latitude < -90 || formData.latitude > 90) {
      errs.latitude = 'Latitude deve estar entre -90 e 90'
    }

    if (formData.longitude < -180 || formData.longitude > 180) {
      errs.longitude = 'Longitude deve estar entre -180 e 180'
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
      const payload: PropertyCreate = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        total_area_ha: Number(formData.total_area_ha),
        cultivated_area_ha:
          formData.cultivated_area_ha !== undefined
            ? Number(formData.cultivated_area_ha)
            : undefined,
        country: formData.country?.trim() || 'Brasil',
        state: formData.state.toUpperCase().trim(),
        municipality: formData.municipality.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      }

      let saved: Property
      if (isEditing && property) {
        saved = await propertiesApi.update(property.id, payload)
      } else {
        saved = await propertiesApi.create(payload)
      }

      onSuccess(saved)
      onClose()
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Erro ao salvar propriedade. Verifique os dados inseridos.'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Propriedade' : 'Nova Propriedade'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {apiError}
          </div>
        )}

        <Input
          label="Nome da Propriedade"
          required
          placeholder="Ex: Fazenda Boa Esperança"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
        />

        <Textarea
          label="Descrição"
          placeholder="Descrição geral da propriedade, histórico ou observações..."
          rows={3}
          value={formData.description || ''}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Área Total (ha)"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={formData.total_area_ha || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                total_area_ha: parseFloat(e.target.value) || 0,
              })
            }
            error={errors.total_area_ha}
            hint="Em hectares"
          />

          <Input
            label="Área Cultivada (ha)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.cultivated_area_ha ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                cultivated_area_ha: parseFloat(e.target.value) || 0,
              })
            }
            error={errors.cultivated_area_ha}
            hint="Área sob manejo agrícola"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Estado (UF)"
            required
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            error={errors.state}
          >
            {BRAZILIAN_STATES.map((st) => (
              <option key={st.uf} value={st.uf}>
                {st.name} ({st.uf})
              </option>
            ))}
          </Select>

          <Input
            label="Município"
            required
            placeholder="Ex: Ribeirão Preto"
            value={formData.municipality}
            onChange={(e) =>
              setFormData({ ...formData, municipality: e.target.value })
            }
            error={errors.municipality}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Latitude"
            type="number"
            step="0.000001"
            required
            placeholder="-22.9056"
            value={formData.latitude ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                latitude: parseFloat(e.target.value) || 0,
              })
            }
            error={errors.latitude}
            hint="Entre -90.0 e 90.0"
          />

          <Input
            label="Longitude"
            type="number"
            step="0.000001"
            required
            placeholder="-47.0608"
            value={formData.longitude ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                longitude: parseFloat(e.target.value) || 0,
              })
            }
            error={errors.longitude}
            hint="Entre -180.0 e 180.0"
          />
        </div>

        <Input
          label="País"
          placeholder="Brasil"
          value={formData.country || 'Brasil'}
          onChange={(e) =>
            setFormData({ ...formData, country: e.target.value })
          }
        />

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
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Propriedade'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
