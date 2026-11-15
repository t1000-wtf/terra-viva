import { useEffect, useState, useMemo } from 'react'
import {
  Sliders,
  Save,
  Info,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Users,
  TrendingUp,
  Droplets,
  Sprout,
  DollarSign,
  ShieldAlert,
  Apple,
  Layers,
  Wrench,
  Loader2,
  Star
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'
import client from '../../api/client'

interface UserPriorityState {
  id?: number
  user_id?: number
  weight_environmental: number
  weight_social: number
  weight_economic: number
  priority_water_conservation: number
  priority_soil_recovery: number
  priority_income_increase: number
  priority_cost_reduction: number
  priority_food_security: number
  priority_diversification: number
  priority_risk_reduction: number
  priority_easy_management: number
}

const defaultPriorities: UserPriorityState = {
  weight_environmental: 40,
  weight_social: 35,
  weight_economic: 25,
  priority_water_conservation: 5,
  priority_soil_recovery: 5,
  priority_income_increase: 4,
  priority_cost_reduction: 4,
  priority_food_security: 3,
  priority_diversification: 4,
  priority_risk_reduction: 5,
  priority_easy_management: 3,
}

export default function PrioritiesPage() {
  const [priorities, setPriorities] = useState<UserPriorityState>(defaultPriorities)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadPriorities() {
      try {
        setLoading(true)
        setError(null)
        const res = await client.get<UserPriorityState>('/api/v1/priorities')
        if (res.data) {
          setPriorities({
            id: res.data.id,
            user_id: res.data.user_id,
            weight_environmental: Number(res.data.weight_environmental) || 0,
            weight_social: Number(res.data.weight_social) || 0,
            weight_economic: Number(res.data.weight_economic) || 0,
            priority_water_conservation: res.data.priority_water_conservation || 3,
            priority_soil_recovery: res.data.priority_soil_recovery || 3,
            priority_income_increase: res.data.priority_income_increase || 3,
            priority_cost_reduction: res.data.priority_cost_reduction || 3,
            priority_food_security: res.data.priority_food_security || 3,
            priority_diversification: res.data.priority_diversification || 3,
            priority_risk_reduction: res.data.priority_risk_reduction || 3,
            priority_easy_management: res.data.priority_easy_management || 3,
          })
        }
      } catch (err: any) {
        console.error('Erro ao carregar prioridades:', err)
        setError(err.response?.data?.detail || 'Erro ao carregar prioridades')
      } finally {
        setLoading(false)
      }
    }

    loadPriorities()
  }, [])

  const totalWeight = useMemo(() => {
    return Math.round(
      (priorities.weight_environmental +
        priorities.weight_social +
        priorities.weight_economic) *
        10
    ) / 10
  }, [
    priorities.weight_environmental,
    priorities.weight_social,
    priorities.weight_economic,
  ])

  const isWeightValid = Math.abs(totalWeight - 100) <= 0.1

  const pieData = [
    { name: 'Ambiental', value: priorities.weight_environmental, color: '#16a34a' },
    { name: 'Social', value: priorities.weight_social, color: '#0284c7' },
    { name: 'Econômico', value: priorities.weight_economic, color: '#eab308' },
  ]

  const handleSave = async () => {
    if (!isWeightValid) {
      setError(`A soma dos pesos deve ser exatamente 100%. Soma atual: ${totalWeight}%`)
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccessMsg(null)

      const payload = {
        weight_environmental: priorities.weight_environmental,
        weight_social: priorities.weight_social,
        weight_economic: priorities.weight_economic,
        priority_water_conservation: priorities.priority_water_conservation,
        priority_soil_recovery: priorities.priority_soil_recovery,
        priority_income_increase: priorities.priority_income_increase,
        priority_cost_reduction: priorities.priority_cost_reduction,
        priority_food_security: priorities.priority_food_security,
        priority_diversification: priorities.priority_diversification,
        priority_risk_reduction: priorities.priority_risk_reduction,
        priority_easy_management: priorities.priority_easy_management,
      }

      await client.put('/api/v1/priorities', payload)
      setSuccessMsg('Prioridades salvas com sucesso!')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      console.error('Erro ao salvar prioridades:', err)
      setError(err.response?.data?.detail || 'Falha ao salvar prioridades')
    } finally {
      setSaving(false)
    }
  }

  const subPrioritiesList = [
    {
      key: 'priority_water_conservation' as const,
      label: 'Conservação da Água',
      description: 'Preservação de recursos hídricos e mitigação de déficit',
      icon: Droplets,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      key: 'priority_soil_recovery' as const,
      label: 'Recuperação do Solo',
      description: 'Matéria orgânica, descompactação e cobertura vegetal',
      icon: Sprout,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      key: 'priority_income_increase' as const,
      label: 'Aumento de Renda',
      description: 'Maximização da rentabilidade e liquidez das safras',
      icon: TrendingUp,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      key: 'priority_cost_reduction' as const,
      label: 'Redução de Custos',
      description: 'Otimização de insumos externos e menor investimento',
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      key: 'priority_food_security' as const,
      label: 'Segurança Alimentar',
      description: 'Produção para subsistência e consumo familiar',
      icon: Apple,
      color: 'text-red-600 bg-red-50',
    },
    {
      key: 'priority_diversification' as const,
      label: 'Diversificação',
      description: 'Consórcio, policultivo e amplitude de produtos',
      icon: Layers,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      key: 'priority_risk_reduction' as const,
      label: 'Redução de Riscos',
      description: 'Resiliência a secas prolongadas e oscilações de mercado',
      icon: ShieldAlert,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      key: 'priority_easy_management' as const,
      label: 'Manejo Simplificado',
      description: 'Demanda de mão de obra e complexidade operacional',
      icon: Wrench,
      color: 'text-slate-600 bg-slate-100',
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <p className="mt-2 text-sm text-slate-500">Carregando prioridades...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-slate-900">Minhas Prioridades</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Defina o peso de cada pilar e subcritério para calibrar as recomendações agronômicas personalizadas.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !isWeightValid}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-xl transition shadow-sm hover:shadow"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Prioridades
        </button>
      </div>

      {/* Info Callout */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-emerald-900 text-sm">
        <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-800">
            Suas prioridades influenciam diretamente as recomendações agrícolas.
          </p>
          <p className="text-emerald-700 text-xs mt-0.5">
            O algoritmo multicritério (AHP) combina estes parâmetros com os dados biofísicos da NASA, solo e histórico para sugerir as melhores estratégias de cultivo para seus talhões.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section 1: Pesos Dimensionais */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pesos Dimensionais</h2>
            <p className="text-xs text-slate-500">
              Distribua 100% entre as dimensões de sustentabilidade
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Soma Total:</span>
            <span
              className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                isWeightValid
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {totalWeight}% {isWeightValid ? '✓' : '(deve ser 100%)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Sliders */}
          <div className="lg:col-span-2 space-y-5">
            {/* Ambiental */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <Leaf className="w-4 h-4 text-green-600" />
                  <span>Ambiental</span>
                </div>
                <span className="font-bold text-green-700 text-base">
                  {priorities.weight_environmental}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={priorities.weight_environmental}
                onChange={(e) =>
                  setPriorities((prev) => ({
                    ...prev,
                    weight_environmental: Number(e.target.value),
                  }))
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Social */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Social</span>
                </div>
                <span className="font-bold text-sky-700 text-base">
                  {priorities.weight_social}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={priorities.weight_social}
                onChange={(e) =>
                  setPriorities((prev) => ({
                    ...prev,
                    weight_social: Number(e.target.value),
                  }))
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Econômico */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>Econômico</span>
                </div>
                <span className="font-bold text-amber-600 text-base">
                  {priorities.weight_economic}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={priorities.weight_economic}
                onChange={(e) =>
                  setPriorities((prev) => ({
                    ...prev,
                    weight_economic: Number(e.target.value),
                  }))
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Visual Distribution */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 h-64">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Distribuição Visual
            </h3>
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Peso']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium mt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                <span>Ambiental</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                <span>Social</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Econômico</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Sub-Prioridades */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">Sub-Prioridades de Manejo</h2>
          <p className="text-xs text-slate-500">
            Classifique a relevância de cada objetivo de 1 (Baixa) a 5 (Essencial)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subPrioritiesList.map((item) => {
            const Icon = item.icon
            const value = priorities[item.key]

            return (
              <div
                key={item.key}
                className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 leading-tight">
                      {item.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                  <span className="text-xs font-semibold text-slate-600">
                    Nível: {value}/5
                  </span>
                  {/* Star rating selector */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setPriorities((prev) => ({
                            ...prev,
                            [item.key]: star,
                          }))
                        }
                        className="p-1 hover:scale-110 transition-transform focus:outline-hidden"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= value
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
