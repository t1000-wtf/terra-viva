import { useEffect, useState } from 'react'
import {
  Database,
  RadioTower,
  Globe2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  MapPin
} from 'lucide-react'
import client from '../../api/client'

interface DataSourceItem {
  id?: number | string
  name: string
  organization?: string
  type?: string
  source_type?: string
  parameters?: string
  description?: string
  resolution?: string
  coverage?: string
  access_url?: string
  url?: string
  status?: string
}

const DOCUMENTED_SOURCES: DataSourceItem[] = [
  {
    name: 'NASA POWER (Prediction of Worldwide Energy Resources)',
    organization: 'NASA Langley Research Center',
    type: 'Meteorologia & Agroclimatologia',
    parameters: 'Temperatura (2m, Max, Min), Chuva, Radiação Solar, Umidade',
    resolution: '0.5 x 0.5 graus (~50 km)',
    coverage: 'Global',
    access_url: 'https://power.larc.nasa.gov/',
    status: 'Online / API Integrada',
  },
  {
    name: 'NASA SMAP (Soil Moisture Active Passive)',
    organization: 'NASA Jet Propulsion Laboratory (JPL)',
    type: 'Umidade Superficial do Solo (0-5 cm)',
    parameters: 'Umidade volumétrica (m³/m³), Anomalias hídricas',
    resolution: '9 km (EASE-Grid 2.0)',
    coverage: 'Global (revisita a cada 2-3 dias)',
    access_url: 'https://smap.jpl.nasa.gov/',
    status: 'Parcial / requer NASA_EARTHDATA_TOKEN e extração validada do pixel',
  },
  {
    name: 'Landsat 8/9 & MODIS (Terra/Aqua)',
    organization: 'NASA GSFC / USGS',
    type: 'Sensoriamento Remoto Óptico / Vegetação',
    parameters: 'NDVI (Índice de Vegetação da Diferença Normalizada), Cobertura do Solo',
    resolution: '30 m (Landsat) / 250 m (MODIS)',
    coverage: 'Global',
    access_url: 'https://landsat.gsfc.nasa.gov/',
    status: 'Catálogo consultável; extração de pixel não configurada',
  },
  {
    name: 'NASA ECOSTRESS',
    organization: 'NASA JPL (ISS)',
    type: 'Evapotranspiração & Estresse Térmico',
    parameters: 'Evapotranspiração (PT-JPL), Temperatura da Superfície',
    resolution: '70 m x 70 m',
    coverage: 'Global',
    access_url: 'https://ecostress.jpl.nasa.gov/',
    status: 'Não integrada; a ET0 atual é estimada pelo modelo FAO-56',
  },
  {
    name: 'NASA SRTM V3',
    organization: 'NASA / NGA',
    type: 'Topografia & Geomorfologia',
    parameters: 'Elevação (m), Declividade (%) para cálculo de risco de erosão',
    resolution: '30 metros (1 arc-second)',
    coverage: 'Global',
    access_url: 'https://www2.jpl.nasa.gov/srtm/',
    status: 'Integrado via Open-Elevation; não usa Google Earth Engine',
  },
  {
    name: 'IBGE (Instituto Brasileiro de Geografia e Estatística)',
    organization: 'Ministério do Planejamento - Brasil',
    type: 'Dados Territoriais e Censo Agropecuário',
    parameters: 'População rural, IDHM, estabelecimentos familiares vs comerciais',
    resolution: 'Municipal (5.570 municípios)',
    coverage: 'Brasil',
    access_url: 'https://servicodados.ibge.gov.br/',
    status: 'API de localidades integrada; indicadores regionais usam base local de referência',
  },
  {
    name: 'Embrapa (Empresa Brasileira de Pesquisa Agropecuária)',
    organization: 'Ministério da Agricultura e Pecuária - Brasil',
    type: 'Conhecimento Agronômico & Sistemas de Rotação',
    parameters: 'Fixação Biológica de Nitrogênio, Manejo de Palhada, Tolerância à Seca',
    resolution: 'Normas e Guias Técnicos Nacionais',
    coverage: 'Biomas Brasileiros (Cerrado, Caatinga, Mata Atlântica, Pampas)',
    access_url: 'https://www.embrapa.br/',
    status: 'Ativo / Base Normativa',
  },
  {
    name: 'CONAB (Companhia Nacional de Abastecimento)',
    organization: 'Ministério do Desenvolvimento Agrário - Brasil',
    type: 'Economia e Custos Agrícolas',
    parameters: 'Matrizes de custo de produção por hectare e liquidez de grãos',
    resolution: 'Regional e Estadual',
    coverage: 'Brasil',
    access_url: 'https://www.conab.gov.br/',
    status: 'Ativo / Referência de Custos',
  },
]

export default function SourcesPage() {
  const [sources, setSources] = useState<DataSourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  useEffect(() => {
    async function fetchSources() {
      try {
        setLoading(true)
        const res = await client.get<any>('/api/v1/sources')
        const data = Array.isArray(res.data) ? res.data : res.data?.items

        if (data && data.length > 0) {
          setSources(data)
          setIsUsingFallback(false)
        } else {
          setSources(DOCUMENTED_SOURCES)
          setIsUsingFallback(true)
        }
      } catch (err) {
        console.warn('Falha na API de fontes, utilizando fontes documentadas:', err)
        setSources(DOCUMENTED_SOURCES)
        setIsUsingFallback(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSources()
  }, [])

  const getSourceIcon = (typeStr: string = '', nameStr: string = '') => {
    const combined = (typeStr + ' ' + nameStr).toLowerCase()
    if (combined.includes('nasa') || combined.includes('satélite') || combined.includes('smap') || combined.includes('landsat') || combined.includes('ecostress') || combined.includes('srtm')) {
      return RadioTower
    }
    if (combined.includes('ibge') || combined.includes('territorial') || combined.includes('geografia')) {
      return Globe2
    }
    if (combined.includes('embrapa') || combined.includes('pesquisa') || combined.includes('conhecimento')) {
      return BookOpen
    }
    return Database
  }

  const getStatusBadge = (statusStr: string = '') => {
    const s = statusStr.toLowerCase()
    if (s.includes('online') || s.includes('integrada') || s.includes('integrado') || s.includes('ativo')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {statusStr || 'Integrada'}
        </span>
      )
    }
    if (s.includes('parcial') || s.includes('catálogo') || s.includes('catalogo')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          {statusStr || 'Parcial'}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        {statusStr || 'Pendente'}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-slate-900">Fontes de Dados</h1>
            {isUsingFallback && (
              <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md border border-slate-200">
                Fontes Documentadas
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Proveniência transparente de dados biofísicos espaciais, climatológicos e socioeconômicos utilizados no TerraViva.
          </p>
        </div>
      </div>

      {/* Grid of Sources */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded-sm w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-sm w-1/2" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded-sm w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source, index) => {
            const Icon = getSourceIcon(source.type || source.source_type, source.name)
            const link = source.access_url || source.url

            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 hover:border-green-300 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 group"
              >
                <div className="space-y-4">
                  {/* Top Bar with Icon & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 group-hover:bg-green-600 group-hover:text-white transition flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      {getStatusBadge(source.status)}
                    </div>
                  </div>

                  {/* Title & Organization */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-green-700 transition">
                      {source.name}
                    </h3>
                    {source.organization && (
                      <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {source.organization}
                      </p>
                    )}
                  </div>

                  {/* Type / Parameters Box */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs">
                    {source.type && (
                      <div>
                        <span className="text-slate-400 font-medium">Categoria:</span>{' '}
                        <span className="text-slate-800 font-semibold">{source.type}</span>
                      </div>
                    )}

                    {source.parameters && (
                      <div>
                        <span className="text-slate-400 font-medium">Parâmetros:</span>{' '}
                        <span className="text-slate-700">{source.parameters}</span>
                      </div>
                    )}

                    {source.description && (
                      <div>
                        <span className="text-slate-400 font-medium">Descrição:</span>{' '}
                        <span className="text-slate-700">{source.description}</span>
                      </div>
                    )}

                    {(source.resolution || source.coverage) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-slate-200/50 text-[11px] text-slate-500">
                        {source.resolution && (
                          <span>
                            <strong>Resolução:</strong> {source.resolution}
                          </span>
                        )}
                        {source.coverage && (
                          <span>
                            <strong>Cobertura:</strong> {source.coverage}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Link */}
                {link && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Portal oficial</span>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 group-hover:underline"
                    >
                      Acessar Portal
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
