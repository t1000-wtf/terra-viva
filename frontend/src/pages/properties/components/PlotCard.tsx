import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/common/Card'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { formatArea } from '../../../utils/format'
import type { Plot } from '../../../types'
import {
  Sprout,
  Layers,
  Sparkles,
  Eye,
  Pencil,
  Trash2,
  Lightbulb,
  Droplets,
} from 'lucide-react'

interface PlotCardProps {
  plot: Plot
  propertyId: number
  onEdit: (plot: Plot) => void
  onDelete: (plot: Plot) => void
}

export function PlotCard({
  plot,
  propertyId,
  onEdit,
  onDelete,
}: PlotCardProps) {
  const navigate = useNavigate()

  return (
    <Card hoverable className="h-full flex flex-col justify-between">
      <div className="space-y-4">
        {/* Top Header: Name and Area */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-900 text-base truncate">
              {plot.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" size="sm">
                {formatArea(plot.area_ha)}
              </Badge>
              {plot.soil_type && (
                <Badge variant="purple" size="sm">
                  {plot.soil_type}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Current Crop Banner */}
        {plot.current_crop ? (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
            <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-medium text-emerald-900">Cultura Atual: </span>
              <span className="font-semibold">{plot.current_crop}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
            <span className="italic">Nenhuma cultura ativa (em pousio)</span>
          </div>
        )}

        {/* Quick Attributes Chips */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
          {plot.ph !== undefined && plot.ph !== null && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-50">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>pH: <strong>{plot.ph}</strong></span>
            </div>
          )}

          {plot.soil_texture && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-50">
              <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">Textura: <strong>{plot.soil_texture}</strong></span>
            </div>
          )}

          {plot.organic_matter_pct !== undefined && plot.organic_matter_pct !== null && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-50">
              <span>M.O.: <strong>{plot.organic_matter_pct}%</strong></span>
            </div>
          )}

          {plot.irrigation_system && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-50">
              <Droplets className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">{plot.irrigation_system}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/properties/${propertyId}/plots/${plot.id}`)}
          >
            Ver
          </Button>

          <Button
            size="xs"
            variant="ghost"
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
            onClick={() => onEdit(plot)}
          >
            Editar
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="xs"
            variant="outline"
            className="text-amber-700 border-amber-200 hover:bg-amber-50"
            leftIcon={<Lightbulb className="w-3.5 h-3.5 text-amber-500" />}
            onClick={() => navigate(`/recommendations/${plot.id}`)}
          >
            Recomendações
          </Button>

          <Button
            size="xs"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onDelete(plot)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
