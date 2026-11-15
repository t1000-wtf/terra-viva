import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Lightbulb, Sparkles } from 'lucide-react'
import { recommendationsApi } from '../api/recommendations'
import type { RecommendationItem } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Spinner } from '../components/common/Spinner'

export function RecommendationsPage() {
  const { plotId } = useParams<{ plotId: string }>()
  const idNum = Number(plotId)

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const loadData = async () => {
    if (!idNum) return
    setLoading(true)
    try {
      const data = await recommendationsApi.getByPlot(idNum)
      setRecommendations(data)
    } catch (err) {
      console.error('Erro ao buscar recomendações:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [idNum])

  const handleGenerate = async () => {
    if (!idNum) return
    setGenerating(true)
    try {
      const newItems = await recommendationsApi.generate(idNum)
      setRecommendations(newItems)
    } catch (err) {
      console.error('Erro ao gerar recomendações:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recomendações Agronômicas & IA"
        breadcrumbs={[
          { label: 'Propriedades', href: '/properties' },
          { label: `Talhão ${idNum || ''}` },
          { label: 'Recomendações' },
        ]}
        description="Prescrições geradas por inteligência artificial baseadas no histórico de safras, clima e bioma."
        actions={
          <Button
            variant="primary"
            leftIcon={<Sparkles className="w-4 h-4" />}
            onClick={handleGenerate}
            loading={generating}
          >
            Gerar com IA
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : recommendations.length === 0 ? (
        <Card className="py-12 text-center text-sm text-slate-500">
          Nenhuma recomendação disponível para este talhão. Clique em &quot;Gerar com IA&quot; para analisar os dados.
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">{rec.strategy_title || rec.title}</h4>
                      {(rec.score_overall != null || rec.confidence_score != null) && (
                        <Badge variant="info" size="sm">
                          Score: {rec.score_overall != null ? `${(rec.score_overall).toFixed(1)}/100` : `${((rec.confidence_score || 0) * 100).toFixed(0)}%`}
                        </Badge>
                      )}
                      {rec.confidence_level && (
                        <Badge variant="success" size="sm">
                          Confiança: {rec.confidence_level}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{rec.strategy_description || rec.description}</p>
                    {rec.crop_sequence && rec.crop_sequence.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-500">Sequência:</span>
                        {rec.crop_sequence.map((crop, idx) => (
                          <span key={idx} className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {crop}
                          </span>
                        ))}
                      </div>
                    )}
                    {rec.justification && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded">
                        <strong>Justificativa:</strong> {rec.justification}
                      </p>
                    )}
                    {(rec.sources_cited || rec.source) && (
                      <p className="text-xs text-slate-400 mt-2">
                        Fonte / Referência: {rec.sources_cited ? rec.sources_cited.join(', ') : rec.source}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
