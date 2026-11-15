import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp } from 'lucide-react'
import { economicApi } from '../api/economic'
import { cropsApi } from '../api/crops'
import type { CropCatalog, EconomicEstimateResponse } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Spinner } from '../components/common/Spinner'
import { formatCurrency } from '../utils/format'

export function EconomicPage() {
  const [crops, setCrops] = useState<CropCatalog[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [area, setArea] = useState('1')
  const [estimate, setEstimate] = useState<EconomicEstimateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cropsApi.listAll().then((items) => {
      setCrops(items)
      if (items.length) setSelected([items[0].common_name || items[0].name])
    }).catch((cause: any) => setError(cause?.response?.data?.detail || 'Não foi possível carregar o catálogo de culturas.')).finally(() => setLoading(false))
  }, [])

  const calculate = async () => {
    if (!selected.length || Number(area) < 0.1) return
    setCalculating(true)
    setError('')
    try {
      setEstimate(await economicApi.getEstimate(selected.join(','), Number(area)))
    } catch (cause: any) {
      setError(cause?.response?.data?.detail || 'Não foi possível gerar a estimativa econômica.')
    } finally {
      setCalculating(false)
    }
  }

  return <div className="space-y-6">
    <PageHeader title="Estimativa Econômica" description="Estimativas de custo e liquidez calculadas com o catálogo agronômico disponível." />
    <Card className="p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Área cultivada (ha)" type="number" min="0.1" step="0.1" value={area} onChange={(event) => setArea(event.target.value)} />
        <div><p className="text-sm font-medium text-slate-700 mb-2">Culturas da sequência</p>{loading ? <Spinner size="sm" /> : <div className="flex flex-wrap gap-3">{crops.map((crop) => { const cropName = crop.common_name || crop.name; return <label key={crop.id} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={selected.includes(cropName)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, cropName] : current.filter((name) => name !== cropName))} />{cropName}</label> })}</div>}</div>
      </div>
      <Button variant="primary" loading={calculating} disabled={!selected.length || loading} leftIcon={<TrendingUp className="w-4 h-4" />} onClick={calculate}>Calcular estimativa</Button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </Card>
    {estimate && <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-sm text-slate-500">Investimento estimado</p><p className="mt-2 text-2xl font-bold text-slate-900">{estimate.estimated_total_investment_brl == null ? 'Não disponível' : formatCurrency(estimate.estimated_total_investment_brl)}</p></Card>
        <Card className="p-5"><p className="text-sm text-slate-500">Custo por hectare</p><p className="mt-2 text-2xl font-bold text-slate-900">{estimate.cost_per_ha_brl == null ? 'Não disponível' : formatCurrency(estimate.cost_per_ha_brl)}</p></Card>
        <Card className="p-5"><p className="text-sm text-slate-500">Liquidez de mercado</p><p className="mt-2 text-2xl font-bold text-slate-900">{estimate.market_liquidity_general || 'Indeterminada'}</p></Card>
      </div>
      <Card title="Culturas consideradas" className="p-5"><div className="divide-y divide-slate-100">{estimate.crops_breakdown.map((crop) => <div key={crop.crop} className="py-3 flex items-center justify-between gap-4"><div><p className="font-medium text-slate-800">{crop.crop}</p><p className="text-xs text-slate-500">Liquidez: {crop.market_liquidity || 'N/D'} · Manejo: {crop.management_complexity || 'N/D'}</p></div><span className="text-sm font-semibold text-slate-700">{crop.cost_per_ha_brl == null ? 'Sem custo cadastrado' : `${formatCurrency(crop.cost_per_ha_brl)}/ha`}</span></div>)}</div><div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm text-amber-900"><DollarSign className="w-4 h-4 inline mr-1" />{estimate.uncertainty_note}</div><p className="mt-3 text-xs text-slate-500">Fontes: {estimate.sources.join(', ')}</p></Card>
    </>}
  </div>
}
