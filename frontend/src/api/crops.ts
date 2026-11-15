import client from './client'
import type { CropCatalog, PaginatedResponse } from '../types'

export const cropsApi = {
  list: async (params?: { search?: string; category?: string }): Promise<PaginatedResponse<CropCatalog>> => {
    const res = await client.get<PaginatedResponse<CropCatalog> | CropCatalog[]>('/api/v1/crops', { params })
    if (Array.isArray(res.data)) return { items: res.data, total: res.data.length, page: 1, size: res.data.length, pages: 1 }
    return res.data
  },

  listAll: async (): Promise<CropCatalog[]> => {
    const res = await client.get<CropCatalog[]>('/api/v1/crops')
    return res.data
  },

  get: async (id: number): Promise<CropCatalog> => {
    const res = await client.get<CropCatalog>(`/api/v1/crops/${id}`)
    return res.data
  },
}
