import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { History, Plus, Wheat, CalendarDays, TrendingUp, AlertCircle, X, Loader2 } from 'lucide-react'
import client from '../../api/client'

interface CropHistoryEntry {
  id: number
  plot_id: number
  crop_name: string
  planting_date?: string
  harvest_date?: string
  season_name?: string
  productivity_kg_ha?: number
  water_consumption_estimated_mm?: number
  production_cost_brl?: number
  pest_or_disease_issues?: string
  notes?: string
  // scaffold compat
  variety?: string
  area_planted_ha?: number
  production_kg?: number
  revenue?: number
  cost?: number
  status?: string
  created_at?: string
}

interface FormData {
  crop_name: string
  planting_date: string
  harvest_date: string
  season_name: string
  productivity_kg_ha: string
  water_consumption_estimated_mm: string
  production_cost_brl: string
  pest_or_disease_issues: string
  notes: string
}

const initialForm: FormData = {
  crop_name: '',
  planting_date: '',
  harvest_date: '',
  season_name: '',
  productivity_kg_ha: '',
  water_consumption_estimated_mm: '',
  production_cost_brl: '',
  pest_or_disease_issues: '',
  notes: '',
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function SkeletonRow() {
  return (
    <div className="animate-pulse flex gap-4 p-5 bg-white rounded-xl border border-slate-200">
      <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const { plotId } = useParams<{ plotId: string }>()
  const [entries, setEntries] = useState<CropHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormData>(initialForm)
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const fetchHistory = useCallback(async () => {
    if (!plotId) return
    setLoading(true)
    setError(null)
    try {
      const res = await client.get(`/api/v1/plots/${plotId}/history`)
      const data = res.data
      const list: CropHistoryEntry[] = Array.isArray(data) ? data : data.items ?? []
      // Sort newest first
      list.sort((a, b) => {
        const da = a.planting_date || a.created_at || ''
        const db = b.planting_date || b.created_at || ''
        return db.localeCompare(da)
      })
      setEntries(list)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Erro ao carregar histórico.')
    } finally {
      setLoading(false)
    }
  }, [plotId])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const validate = (): boolean => {
    const errors: Partial<FormData> = {}
    if (!form.crop_name.trim()) errors.crop_name = 'Nome da cultura é obrigatório'
    if (!form.planting_date) errors.planting_date = 'Data de plantio é obrigatória'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate() || !plotId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: Record<string, any> = {
        plot_id: parseInt(plotId),
        crop_name: form.crop_name,
        planting_date: form.planting_date || undefined,
        harvest_date: form.harvest_date || undefined,
        season_name: form.season_name || undefined,
        productivity_kg_ha: form.productivity_kg_ha ? parseFloat(form.productivity_kg_ha) : undefined,
        water_consumption_estimated_mm: form.water_consumption_estimated_mm ? parseFloat(form.water_consumption_estimated_mm) : undefined,
        production_cost_brl: form.production_cost_brl ? parseFloat(form.production_cost_brl) : undefined,
        pest_or_disease_issues: form.pest_or_disease_issues || undefined,
        notes: form.notes || undefined,
      }
      await client.post(`/api/v1/plots/${plotId}/history`, payload)
      setSubmitSuccess(true)
      setShowModal(false)
      setForm(initialForm)
      fetchHistory()
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (e: any) {
      setSubmitError(e?.response?.data?.detail || 'Erro ao registrar safra.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Histórico Agrícola — Talhão {plotId}</h1>
              <p className="text-sm text-slate-500">Registro de safras e produções</p>
            </div>
          </div>
          <button
            onClick={() => { setShowModal(true); setSubmitError(null); setForm(initialForm); setFormErrors({}) }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Safra
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Success banner */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
            <span>✓</span> Safra registrada com sucesso!
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Timeline */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum registro histórico</h3>
            <p className="text-sm text-slate-500 mb-4">Registre sua primeira safra.</p>
            <button
              onClick={() => { setShowModal(true); setForm(initialForm); setFormErrors({}) }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Registrar Safra
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-green-200" />
            <div className="space-y-4 pl-16">
              {entries.map((entry) => (
                <div key={entry.id} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-10 top-4 w-4 h-4 rounded-full border-2 border-green-500 bg-white" />
                  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.season_name && (
                            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                              {entry.season_name}
                            </span>
                          )}
                          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                            <Wheat className="w-4 h-4 text-green-600" />
                            {entry.crop_name}
                          </h3>
                        </div>
                        {(entry.planting_date || entry.harvest_date) && (
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDate(entry.planting_date)}
                            {entry.harvest_date && ` → ${formatDate(entry.harvest_date)}`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(entry.productivity_kg_ha != null) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <TrendingUp className="w-3 h-3" />
                            {entry.productivity_kg_ha.toLocaleString('pt-BR')} kg/ha
                          </span>
                        )}
                        {(entry.production_cost_brl != null || entry.cost != null) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            R$ {((entry.production_cost_brl ?? entry.cost) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    {entry.pest_or_disease_issues && (
                      <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 mb-2">
                        ⚠ {entry.pest_or_disease_issues}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-slate-500 italic">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Registrar Safra</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {submitError}
                </div>
              )}

              {/* crop_name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome da Cultura <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.crop_name}
                  onChange={e => handleChange('crop_name', e.target.value)}
                  placeholder="Ex: Soja, Milho, Sorgo..."
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.crop_name ? 'border-red-400' : 'border-slate-200'}`}
                />
                {formErrors.crop_name && <p className="text-xs text-red-500 mt-1">{formErrors.crop_name}</p>}
              </div>

              {/* season_name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Safra</label>
                <input
                  type="text"
                  value={form.season_name}
                  onChange={e => handleChange('season_name', e.target.value)}
                  placeholder="Ex: Safra 2024/25"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* planting_date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de Plantio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.planting_date}
                    onChange={e => handleChange('planting_date', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.planting_date ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {formErrors.planting_date && <p className="text-xs text-red-500 mt-1">{formErrors.planting_date}</p>}
                </div>

                {/* harvest_date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Colheita</label>
                  <input
                    type="date"
                    value={form.harvest_date}
                    onChange={e => handleChange('harvest_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Produtividade (kg/ha)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.productivity_kg_ha}
                    onChange={e => handleChange('productivity_kg_ha', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Custo de Produção (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.production_cost_brl}
                    onChange={e => handleChange('production_cost_brl', e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Consumo Hídrico Estimado (mm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.water_consumption_estimated_mm}
                  onChange={e => handleChange('water_consumption_estimated_mm', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pragas / Doenças</label>
                <textarea
                  rows={2}
                  value={form.pest_or_disease_issues}
                  onChange={e => handleChange('pest_or_disease_issues', e.target.value)}
                  placeholder="Descreva problemas fitossanitários..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  placeholder="Notas adicionais..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Registrar Safra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
