import client from './client'
import type { Plot, PlotCreate, PaginationParams } from '../types'

export const plotsApi = {
  list: async (propertyId: number, params?: PaginationParams): Promise<Plot[]> => {
    const res = await client.get<any>(`/api/v1/properties/${propertyId}/plots`, { params })
    if (Array.isArray(res.data)) return res.data
    if (res.data && Array.isArray(res.data.items)) return res.data.items
    return []
  },

  listAll: async (propertyId: number): Promise<Plot[]> => {
    return plotsApi.list(propertyId)
  },

  get: async (propertyId: number, plotId: number): Promise<Plot> => {
    const res = await client.get<Plot>(`/api/v1/properties/${propertyId}/plots/${plotId}`)
    return res.data
  },

  create: async (data: PlotCreate & { property_id?: number }, propertyId?: number): Promise<Plot> => {
    const targetPropId = propertyId || data.property_id
    const res = await client.post<Plot>(`/api/v1/properties/${targetPropId}/plots`, data)
    return res.data
  },

  update: async (propertyId: number, plotId: number, data: Partial<PlotCreate>): Promise<Plot> => {
    const res = await client.put<Plot>(`/api/v1/properties/${propertyId}/plots/${plotId}`, data)
    return res.data
  },

  delete: async (propertyId: number, plotId: number): Promise<void> => {
    await client.delete(`/api/v1/properties/${propertyId}/plots/${plotId}`)
  },
}
