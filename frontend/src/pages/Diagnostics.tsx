import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { diagnosticsApi } from '../api/diagnostics'
import { propertiesApi } from '../api/properties'
import type { DiagnosticReport, Property } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'

const sections: Array<[keyof DiagnosticReport, string]> = [
  ['land_needs', 'Necessidades da terra'],
  ['farmer_needs', 'Necessidades do produtor'],
  ['region_offers', 'Recursos da região'],
]

export function DiagnosticsPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const id = Number(propertyId)
  const [property, setProperty] = useState<Property | null>(null)
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [propertyData, diagnostic] = await Promise.all([
        propertiesApi.get(id),
        diagnosticsApi.getPropertyDiagnostic(id),
      ])
      setProperty(propertyData)
      setReport(diagnostic)
    } catch (cause: any) {
      setError(cause?.response?.data?.detail || 'Não foi possível gerar o diagnóstico integrado.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <PageHeader title="Diagnóstico Socioambiental" description={property ? `${property.name} — ${property.municipality}/${property.state}` : 'Análise integrada da propriedade'} actions={<Button variant="outline" onClick={load} disabled={loading}>Atualizar diagnóstico</Button>} />
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : error ? (
        <Card className="p-6 border-red-200 bg-red-50"><p role="alert" className="text-sm text-red-800">{error}</p></Card>
      ) : report ? <>
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 mb-3"><h2 className="font-semibold text-slate-900">Síntese</h2><Badge variant="success">Gerado com dados da propriedade</Badge></div>
          <p className="text-sm leading-relaxed text-slate-700">{report.synthesis}</p>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {sections.map(([key, title]) => {
            const value = report[key]
            const entries = value && typeof value === 'object' ? Object.entries(value as Record<string, unknown>) : []
            return <Card key={key} title={title} className="p-5"><dl className="space-y-3">{entries.map(([label, detail]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-500">{label.replaceAll('_', ' ')}</dt><dd className="mt-1 text-sm text-slate-700">{typeof detail === 'string' ? detail : JSON.stringify(detail)}</dd></div>)}</dl></Card>
          })}
        </div>
        {!!report.active_alerts?.length && <Card title="Alertas ativos" className="p-5"><div className="space-y-3">{report.active_alerts.map((alert, index) => <div key={`${alert.title}-${index}`} className="border-b border-slate-100 pb-3 last:border-0"><p className="font-medium text-slate-800">{alert.title || alert.type}</p><p className="text-sm text-slate-600 mt-1">{alert.description}</p></div>)}</div></Card>}
      </> : null}
    </div>
  )
}
