import client from './client'
import type {
  RecommendationItemDetail,
} from '../types'

export const recommendationsApi = {
  generate: async (plotId: number): Promise<RecommendationItemDetail[]> => {
    const res = await client.post<RecommendationItemDetail[]>(`/api/v1/recommendations/generate/${plotId}`)
    return res.data
  },

  getByPlot: async (plotId: number): Promise<RecommendationItemDetail[]> => {
    const res = await client.get<RecommendationItemDetail[]>(`/api/v1/recommendations/plot/${plotId}`)
    return res.data
  },
}
