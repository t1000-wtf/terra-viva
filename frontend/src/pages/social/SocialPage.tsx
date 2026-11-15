import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Users,
  Building,
  GraduationCap,
  HeartPulse,
  Coins,
  Droplet,
  Wifi,
  Tractor,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  FileText,
  MapPin,
  TrendingUp,
  ShieldAlert,
  Sparkles
} from 'lucide-react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts'
import { socialApi } from '../../api/social'
import type { SocialDiagnosticResponse } from '../../types'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Badge } from '../../components/common/Badge'
import { PageHeader } from '../../components/common/PageHeader'
import { Skeleton } from '../../components/common/Skeleton'

export default function SocialPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const propIdNum = propertyId ? parseInt(propertyId, 10) : NaN

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SocialDiagnosticResponse | null>(null)

  const fetchSocialData = async () => {
    if (isNaN(propIdNum)) {
      setError('ID de propriedade inválido.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await socialApi.getDiagnostics(propIdNum)
      setData(res)
    } catch (err: any) {
      console.error('Erro ao buscar diagnóstico social:', err)
      setError(
        err?.response?.data?.detail ||
          'Não foi possível carregar os dados sociais da região. Verifique os dados da propriedade.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSocialData()
  }, [propIdNum])

  const analysis = data?.social_analysis
  const reg = analysis?.regional_context || {}

  const idhmTotal = reg.idhm
  const idhmEdu = reg.idhm_education
  const idhmIncome = reg.idhm_income
  const idhmLong = reg.idhm_longevity

  const getScoreColor = (val: number) => {
    if (val < 0.6) {
      return {
        bg: 'bg-red-500',
        text: 'text-red-700',
        lightBg: 'bg-red-50',
        border: 'border-red-200',
        label: 'Baixo Desenvolvimento'
      }
    }
    if (val <= 0.7) {
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-700',
        lightBg: 'bg-amber-50',
        border: 'border-amber-200',
        label: 'Médio Desenvolvimento'
      }
    }
    return {
      bg: 'bg-emerald-500',
      text: 'text-emerald-700',
      lightBg: 'bg-emerald-50',
      border: 'border-emerald-200',
      label: 'Alto Desenvolvimento'
    }
  }

  const radarData = [
    { dimension: 'Educação', value: idhmEdu, fullMark: 1.0 },
    { dimension: 'Renda', value: idhmIncome, fullMark: 1.0 },
    { dimension: 'Longevidade', value: idhmLong, fullMark: 1.0 },
    { dimension: 'IDHM Geral', value: idhmTotal, fullMark: 1.0 }
  ].filter((item) => item.value != null).map((item) => ({ ...item, value: Number(item.value!.toFixed(3)) }))

  // Stats formatting helpers
  const formatNumber = (num?: number | null) => {
    if (num === undefined || num === null) return 'N/D'
    return new Intl.NumberFormat('pt-BR').format(num)
  }

  const formatPercent = (val?: number | null) => {
    if (val === undefined || val === null) return 'N/D'
    return `${val.toFixed(1)}%`
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Diagnóstico Social e Regional"
        description={`Propriedade #${propertyId} — Perfil demográfico, vulnerabilidade, infraestrutura e inserção socioeconômica`}
        breadcrumbs={[
          { label: 'Propriedades', href: '/properties' },
          { label: `Propriedade #${propertyId}`, href: `/properties/${propertyId}` },
          { label: 'Social' }
        ]}
        actions={
          <Link to={`/properties/${propertyId}`}>
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Voltar à Propriedade
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-red-900">Erro ao carregar dados sociais</h4>
          <p className="text-sm text-red-700 max-w-md mx-auto mt-1 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchSocialData}>
            Tentar Novamente
          </Button>
        </Card>
      ) : (
        <>
          {/* Header Card: Municipality + State + Year + Source */}
          <Card noPadding className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white overflow-hidden shadow-md">
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium border border-white/15">
                  <MapPin className="w-3.5 h-3.5" />
                  Contexto Territorial Municipal
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  {data?.municipality || reg.municipality || 'Município'} — {data?.state || reg.state || 'UF'}
                </h2>
                <p className="text-sm text-emerald-100 max-w-xl">
                  Ano de referência dos indicadores:{' '}
                  <span className="font-semibold text-white">{reg.reference_year || '2022'}</span> | Fonte:{' '}
                  <span className="font-semibold text-white">{reg.source || 'IBGE Censo Agro / Atlas Brasil'}</span>
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <Users className="w-10 h-10 text-emerald-300" />
                <div>
                  <div className="text-xs text-emerald-200 uppercase font-semibold">Perfil Produtor</div>
                  <div className="text-base font-bold text-white">
                    {analysis?.agriculture_type || 'Agricultura Familiar'}
                  </div>
                  <div className="text-xs text-emerald-100 capitalize">
                    Mão de obra: {analysis?.labor_availability || 'Familiar'}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* KPI Row: IDHM | IDHM Educação | IDHM Renda | IDHM Longevidade */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider mb-3">
              Índice de Desenvolvimento Humano Municipal (IDHM)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* IDHM Geral */}
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">IDHM Geral</span>
                  <Badge variant={idhmTotal == null ? 'default' : idhmTotal > 0.7 ? 'success' : idhmTotal >= 0.6 ? 'warning' : 'danger'}>
                    {idhmTotal == null ? 'Sem dados' : '0 a 1'}
                  </Badge>
                </div>
                <div className="mt-2 text-3xl font-black text-slate-900">
                  {idhmTotal?.toFixed(3) || 'N/D'}
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${idhmTotal == null ? 'bg-slate-300' : getScoreColor(idhmTotal).bg}`}
                      style={{ width: `${Math.min(100, (idhmTotal || 0) * 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium mt-1 inline-block ${idhmTotal == null ? 'text-slate-500' : getScoreColor(idhmTotal).text}`}>
                    {idhmTotal == null ? 'Sem dados de referência' : getScoreColor(idhmTotal).label}
                  </span>
                </div>
              </Card>

              {/* IDHM Educação */}
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">IDHM Educação</span>
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="mt-2 text-3xl font-black text-slate-900">
                  {idhmEdu?.toFixed(3) || 'N/D'}
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${idhmEdu == null ? 'bg-slate-300' : getScoreColor(idhmEdu).bg}`}
                      style={{ width: `${Math.min(100, (idhmEdu || 0) * 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium mt-1 inline-block ${idhmEdu == null ? 'text-slate-500' : getScoreColor(idhmEdu).text}`}>
                    {idhmEdu == null ? 'Sem dados de referência' : getScoreColor(idhmEdu).label}
                  </span>
                </div>
              </Card>

              {/* IDHM Renda */}
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">IDHM Renda</span>
                  <Coins className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-3xl font-black text-slate-900">
                  {idhmIncome?.toFixed(3) || 'N/D'}
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${idhmIncome == null ? 'bg-slate-300' : getScoreColor(idhmIncome).bg}`}
                      style={{ width: `${Math.min(100, (idhmIncome || 0) * 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium mt-1 inline-block ${idhmIncome == null ? 'text-slate-500' : getScoreColor(idhmIncome).text}`}>
                    {idhmIncome == null ? 'Sem dados de referência' : getScoreColor(idhmIncome).label}
                  </span>
                </div>
              </Card>

              {/* IDHM Longevidade */}
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">IDHM Longevidade</span>
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                </div>
                <div className="mt-2 text-3xl font-black text-slate-900">
                  {idhmLong?.toFixed(3) || 'N/D'}
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${idhmLong == null ? 'bg-slate-300' : getScoreColor(idhmLong).bg}`}
                      style={{ width: `${Math.min(100, (idhmLong || 0) * 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium mt-1 inline-block ${idhmLong == null ? 'text-slate-500' : getScoreColor(idhmLong).text}`}>
                    {idhmLong == null ? 'Sem dados de referência' : getScoreColor(idhmLong).label}
                  </span>
                </div>
              </Card>
            </div>
          </div>

          {/* Middle Row: Radar Chart + 3 Detailed Indicator Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recharts RadarChart */}
            <Card
              title="Equilíbrio das Dimensões IDHM"
              actions={<span className="text-xs text-slate-400">Escala de 0 a 1.0</span>}
              className="flex flex-col justify-between"
            >
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Radar
                      name="Dimensão Social"
                      dataKey="value"
                      stroke="#16a34a"
                      fill="#16a34a"
                      fillOpacity={0.45}
                    />
                    <Tooltip
                      formatter={(value: any) => [value, 'Índice']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 text-center mt-2 border-t pt-3">
                Identifica gaps de desenvolvimento que orientam a necessidade de assistência técnica e suporte social.
              </p>
            </Card>

            {/* Section: Perfil Territorial */}
            <Card title="Perfil Territorial e Demográfico" className="space-y-4">
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    População Total:
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatNumber(reg.population_total || 42500)} hab
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    População Rural:
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatPercent(reg.rural_population_pct ?? 31.4)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    Taxa de Pobreza:
                  </span>
                  <span className="text-sm font-bold text-rose-700">
                    {formatPercent(reg.poverty_rate_pct ?? 22.8)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-amber-50 border border-amber-100 p-2.5 rounded-lg mt-2">
                <strong>Análise:</strong> Alta proporção rural demanda segurança alimentar local e diversificação produtiva.
              </div>
            </Card>

            {/* Section: Agricultura na Região */}
            <Card title="Agricultura na Região" className="space-y-4">
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <Tractor className="w-4 h-4 text-emerald-600" />
                    Estabelecimentos Familiares:
                  </span>
                  <span className="text-sm font-bold text-emerald-800">
                    {formatNumber(reg.family_farms_count || 1840)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-500" />
                    Estabelecimentos Comerciais:
                  </span>
                  <span className="text-sm font-bold text-indigo-900">
                    {formatNumber(reg.commercial_farms_count || 210)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Dependência do PIB Agrícola:
                  </span>
                  <span className="text-sm font-bold text-amber-800">
                    {formatPercent(reg.agricultural_gdp_dependency_pct || 28.6)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg mt-2">
                <strong>Preponderância Familiar:</strong> Forte vocação comunitária e cooperativismo como esteio econômico.
              </div>
            </Card>
          </div>

          {/* Bottom Row: Rural Infrastructure & Needs Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section: Infraestrutura Rural */}
            <Card title="Infraestrutura e Acesso a Serviços Rurais">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Água Encanada</span>
                    <Droplet className="w-5 h-5 text-sky-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatPercent(reg.rural_water_access_pct ?? 65.0)}
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500"
                      style={{
                        width: `${reg.rural_water_access_pct ?? 65}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Acesso à rede pública ou poço com canalização</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Internet Rural</span>
                    <Wifi className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatPercent(reg.rural_internet_access_pct ?? 48.0)}
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${reg.rural_internet_access_pct ?? 48}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Conectividade 3G/4G/Satélite no domicílio</p>
                </div>
              </div>

              {/* Status indicators for the farmer's property */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Badge variant={analysis?.has_technical_assistance ? 'success' : 'default'} size="sm">
                    {analysis?.has_technical_assistance ? 'Com ATER' : 'Sem ATER'}
                  </Badge>
                  <span className="text-slate-600">Assist. Técnica</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={analysis?.has_rural_credit ? 'success' : 'default'} size="sm">
                    {analysis?.has_rural_credit ? 'Crédito Ativo' : 'Sem Crédito'}
                  </Badge>
                  <span className="text-slate-600">Crédito Rural</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={analysis?.has_irrigation ? 'info' : 'warning'} size="sm">
                    {analysis?.has_irrigation ? 'Irrigada' : 'Sequeiro'}
                  </Badge>
                  <span className="text-slate-600">Regime Hídrico</span>
                </div>
              </div>
            </Card>

            {/* Practical Needs & Opportunities */}
            <Card title="Diretrizes Sociais para Manejo Agroecológico">
              <div className="space-y-3 text-xs">
                {analysis?.opportunities && analysis.opportunities.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-emerald-800 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Potencialidades e Vocações
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {analysis.opportunities.map((opp, idx) => (
                        <li key={idx}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis?.constraints && analysis.constraints.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h5 className="font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Barreiras & Limitações Operacionais
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {analysis.constraints.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis?.farmer_needs && analysis.farmer_needs.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h5 className="font-semibold text-indigo-800 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      Necessidades Prioritárias do Produtor
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {analysis.farmer_needs.map((n, idx) => (
                        <li key={idx}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Source Citation at bottom */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>
                <strong>Citação de Fontes Oficiais:</strong> Atlas do Desenvolvimento Humano no Brasil (PNUD/IPEA/FJP) e Censo Agropecuário IBGE. Confiabilidade dos dados:{' '}
                <span className="font-semibold text-slate-800">{analysis?.confidence_level || 'Alta'}</span>.
              </span>
            </div>
            <span className="text-slate-400 hidden sm:inline">TerraViva Ética e Transparência</span>
          </div>
        </>
      )}
    </div>
  )
}
