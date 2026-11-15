import { useEffect, useState, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Wheat, Droplets, Thermometer, Leaf, TrendingUp,
  Calendar, Shield, BookOpen, AlertCircle, CheckCircle2, XCircle,
  Sprout, BarChart2
} from 'lucide-react'
import client from '../../api/client'

interface CropDetail {
  id: number
  common_name?: string
  name?: string
  scientific_name?: string
  category?: string
  botanical_family?: string
  cycle_days?: number
  avg_cycle_days?: number
  water_requirement_mm?: number
  drought_tolerance?: string
  heat_tolerance?: string
  nitrogen_fixation_potential?: boolean
  nitrogen_fixation_kg_ha?: number
  rooting_depth_cm?: number
  erosion_protection?: string
  organic_matter_contribution?: string
  forage_potential?: boolean
  planting_seasons?: string[]
  ideal_temp_min_c?: number
  ideal_temp_max_c?: number
  ideal_ph_min?: number
  ideal_ph_max?: number
  estimated_cost_per_ha_brl?: number
  market_liquidity?: string
  management_complexity?: string
  technical_source?: string
  description?: string
}

function InfoItem({ label, value, icon }: { label: string; value?: string | number | null; icon?: ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      {icon && <span className="mt-0.5 text-green-600 flex-shrink-0">{icon}</span>}
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-900 font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 bg-slate-50 border-b border-slate-200">
        <span className="text-green-600">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  )
}

const liquidityColors: Record<string, string> = {
  Alta: 'text-green-600',
  Média: 'text-yellow-600',
  Baixa: 'text-red-500',
}

const complexityColors: Record<string, string> = {
  Baixa: 'text-green-600',
  Média: 'text-yellow-600',
  Alta: 'text-red-500',
}

export default function CropDetailPage() {
  const { cropId } = useParams<{ cropId: string }>()
  const navigate = useNavigate()
  const [crop, setCrop] = useState<CropDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cropId) return
    setLoading(true)
    client
      .get(`/api/v1/crops/${cropId}`)
      .then(res => setCrop(res.data))
      .catch(e => setError(e?.response?.data?.detail || 'Erro ao carregar cultura.'))
      .finally(() => setLoading(false))
  }, [cropId])

  const displayName = (c: CropDetail) => c.common_name || c.name || '—'
  const cycleDays = (c: CropDetail) => c.cycle_days ?? c.avg_cycle_days

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Carregando cultura...</p>
        </div>
      </div>
    )
  }

  if (error || !crop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold mb-1">Erro ao carregar</p>
          <p className="text-sm text-slate-500 mb-4">{error || 'Cultura não encontrada.'}</p>
          <button onClick={() => navigate('/crops')} className="text-green-600 text-sm font-medium hover:underline">
            ← Voltar ao catálogo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/crops')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Catálogo de Culturas
          </button>
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wheat className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{displayName(crop)}</h1>
              {crop.scientific_name && (
                <p className="text-sm text-slate-400 italic mt-0.5">{crop.scientific_name}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {crop.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {crop.category}
                  </span>
                )}
                {crop.botanical_family && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {crop.botanical_family}
                  </span>
                )}
                {crop.technical_source && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    <BookOpen className="w-3 h-3" />
                    {crop.technical_source}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LEFT: Características Agronômicas */}
        <SectionCard title="Características Agronômicas" icon={<Sprout className="w-4 h-4" />}>
          <InfoItem label="Ciclo" value={cycleDays(crop) ? `${cycleDays(crop)} dias` : undefined} icon={<Calendar className="w-4 h-4" />} />
          <InfoItem label="Necessidade Hídrica" value={crop.water_requirement_mm ? `${crop.water_requirement_mm} mm` : undefined} icon={<Droplets className="w-4 h-4" />} />
          <InfoItem label="Profundidade Radicular" value={crop.rooting_depth_cm ? `${crop.rooting_depth_cm} cm` : undefined} icon={<BarChart2 className="w-4 h-4" />} />
          {crop.botanical_family && (
            <InfoItem label="Família Botânica" value={crop.botanical_family} />
          )}
        </SectionCard>

        {/* RIGHT: Tolerâncias */}
        <SectionCard title="Tolerâncias" icon={<Shield className="w-4 h-4" />}>
          <InfoItem label="Tolerância à Seca" value={crop.drought_tolerance} icon={<Droplets className="w-4 h-4" />} />
          <InfoItem label="Tolerância ao Calor" value={crop.heat_tolerance} icon={<Thermometer className="w-4 h-4" />} />
          <InfoItem label="Proteção contra Erosão" value={crop.erosion_protection} icon={<Shield className="w-4 h-4" />} />
        </SectionCard>

        {/* Requisitos do Solo */}
        <SectionCard title="Requisitos do Solo" icon={<Leaf className="w-4 h-4" />}>
          {(crop.ideal_ph_min != null || crop.ideal_ph_max != null) && (
            <InfoItem
              label="pH Ideal"
              value={
                crop.ideal_ph_min != null && crop.ideal_ph_max != null
                  ? `${crop.ideal_ph_min} – ${crop.ideal_ph_max}`
                  : crop.ideal_ph_min?.toString() || crop.ideal_ph_max?.toString()
              }
            />
          )}
          {(crop.ideal_temp_min_c != null || crop.ideal_temp_max_c != null) && (
            <InfoItem
              label="Temperatura Ideal"
              value={
                crop.ideal_temp_min_c != null && crop.ideal_temp_max_c != null
                  ? `${crop.ideal_temp_min_c}°C – ${crop.ideal_temp_max_c}°C`
                  : `${crop.ideal_temp_min_c ?? crop.ideal_temp_max_c}°C`
              }
              icon={<Thermometer className="w-4 h-4" />}
            />
          )}
          {!crop.ideal_ph_min && !crop.ideal_ph_max && !crop.ideal_temp_min_c && !crop.ideal_temp_max_c && (
            <p className="text-sm text-slate-400 py-3">Dados não disponíveis</p>
          )}
        </SectionCard>

        {/* Viabilidade Econômica */}
        <SectionCard title="Viabilidade Econômica" icon={<TrendingUp className="w-4 h-4" />}>
          <InfoItem
            label="Custo Estimado / ha"
            value={crop.estimated_cost_per_ha_brl
              ? `R$ ${crop.estimated_cost_per_ha_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : undefined}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          {crop.market_liquidity && (
            <div className="flex items-start gap-3 py-2.5 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Liquidez de Mercado</p>
                <p className={`text-sm font-semibold mt-0.5 ${liquidityColors[crop.market_liquidity] || 'text-slate-900'}`}>
                  {crop.market_liquidity}
                </p>
              </div>
            </div>
          )}
          {crop.management_complexity && (
            <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Complexidade de Manejo</p>
                <p className={`text-sm font-semibold mt-0.5 ${complexityColors[crop.management_complexity] || 'text-slate-900'}`}>
                  {crop.management_complexity}
                </p>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Benefícios */}
        <SectionCard title="Benefícios" icon={<CheckCircle2 className="w-4 h-4" />}>
          <div className="py-2 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {crop.nitrogen_fixation_potential ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
              )}
              <span className={crop.nitrogen_fixation_potential ? 'text-slate-800' : 'text-slate-400'}>
                Fixação de Nitrogênio
                {crop.nitrogen_fixation_potential && crop.nitrogen_fixation_kg_ha
                  ? ` (${crop.nitrogen_fixation_kg_ha} kg/ha)`
                  : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {crop.forage_potential ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
              )}
              <span className={crop.forage_potential ? 'text-slate-800' : 'text-slate-400'}>
                Potencial Forrageiro
              </span>
            </div>
            {crop.organic_matter_contribution && (
              <div className="flex items-start gap-2 text-sm mt-1">
                <Leaf className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-800">Matéria Orgânica: {crop.organic_matter_contribution}</span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Calendário */}
        {crop.planting_seasons && crop.planting_seasons.length > 0 && (
          <SectionCard title="Calendário de Plantio" icon={<Calendar className="w-4 h-4" />}>
            <div className="py-3 flex flex-wrap gap-2">
              {crop.planting_seasons.map((season, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200"
                >
                  {season}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Description if any */}
        {crop.description && (
          <div className="md:col-span-2">
            <SectionCard title="Descrição" icon={<BookOpen className="w-4 h-4" />}>
              <p className="text-sm text-slate-700 py-3 leading-relaxed">{crop.description}</p>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  )
}
