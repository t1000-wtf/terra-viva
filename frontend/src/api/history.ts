import client from './client'
import type { CropHistory, CropHistoryCreate } from '../types'

export const historyApi = {
  listAll: async (plotId: number): Promise<CropHistory[]> => {
    const res = await client.get<CropHistory[]>(`/api/v1/plots/${plotId}/history/all`)
    return res.data
  },

  create: async (plotId: number, data: CropHistoryCreate): Promise<CropHistory> => {
    const res = await client.post<CropHistory>(`/api/v1/plots/${plotId}/history`, data)
    return res.data
  },

}
