import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Wheat, Droplets, Leaf, ChevronRight, Filter } from 'lucide-react'
import client from '../../api/client'

interface CropCatalogItem {
  id: number
  common_name: string
  scientific_name?: string
  category?: string
  botanical_family?: string
  cycle_days?: number
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
  // scaffold types compat
  name?: string
  avg_cycle_days?: number
}

const CATEGORIES = ['Todos', 'Grãos', 'Oleaginosas', 'Fibrosas', 'Frutíferas', 'Hortaliças', 'Cobertura', 'Pastagem', 'Leguminosas']

const droughtColors: Record<string, string> = {
  Alta: 'bg-orange-100 text-orange-700',
  Média: 'bg-yellow-100 text-yellow-700',
  Baixa: 'bg-blue-100 text-blue-700',
  alto: 'bg-orange-100 text-orange-700',
  medio: 'bg-yellow-100 text-yellow-700',
  baixo: 'bg-blue-100 text-blue-700',
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-slate-200 rounded w-16" />
        <div className="h-5 bg-slate-200 rounded w-20" />
      </div>
      <div className="h-8 bg-slate-100 rounded w-full" />
    </div>
  )
}

export default function CropsPage() {
  const navigate = useNavigate()
  const [crops, setCrops] = useState<CropCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')

  const fetchCrops = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (category && category !== 'Todos') params.category = category
      const res = await client.get('/api/v1/crops', { params })
      const data = res.data
      setCrops(Array.isArray(data) ? data : data.items ?? [])
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Erro ao carregar culturas.')
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    fetchCrops()
  }, [fetchCrops])

  const displayName = (c: CropCatalogItem) => c.common_name || c.name || '—'
  const cycleDays = (c: CropCatalogItem) => c.cycle_days ?? c.avg_cycle_days

  const filtered = crops.filter(c => {
    const matchSearch = !search || displayName(c).toLowerCase().includes(search.toLowerCase()) || (c.scientific_name || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Todos' || (c.category || '').toLowerCase().includes(category.toLowerCase())
    return matchSearch && matchCat
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <Wheat className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Catálogo de Culturas</h1>
              <p className="text-sm text-slate-500">Explore e compare culturas para sua propriedade</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cultura pelo nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer min-w-[180px]"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Count */}
        {!loading && !error && (
          <p className="text-sm text-slate-500 mb-4">
            {filtered.length} cultura{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Wheat className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhuma cultura encontrada</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  Tente ajustar os filtros ou buscar por outro termo.
                </p>
              </div>
            )
            : filtered.map(crop => (
              <div
                key={crop.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md hover:border-green-200 transition-all duration-200 group"
              >
                {/* Name */}
                <div>
                  <h3 className="font-semibold text-slate-900 text-base leading-tight group-hover:text-green-700 transition-colors">
                    {displayName(crop)}
                  </h3>
                  {crop.scientific_name && (
                    <p className="text-xs text-slate-400 italic mt-0.5">{crop.scientific_name}</p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {crop.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {crop.category}
                    </span>
                  )}
                  {cycleDays(crop) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      <span>{cycleDays(crop)} dias</span>
                    </span>
                  )}
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {crop.drought_tolerance && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${droughtColors[crop.drought_tolerance] || 'bg-slate-100 text-slate-600'}`}>
                      <Droplets className="w-3 h-3" />
                      Seca: {crop.drought_tolerance}
                    </span>
                  )}
                  {crop.nitrogen_fixation_potential && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-700">
                      <Leaf className="w-3 h-3" />
                      Fixa N₂
                    </span>
                  )}
                </div>

                {/* Action */}
                <button
                  onClick={() => navigate(`/crops/${crop.id}`)}
                  className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 px-4 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-600 hover:text-white transition-colors duration-200"
                >
                  Ver Detalhes
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
