import client from './client'
import type { EconomicEstimateResponse } from '../types'

export const economicApi = {
  getEstimate: async (cropNames: string, areaHa: number): Promise<EconomicEstimateResponse> => {
    const res = await client.get<EconomicEstimateResponse>('/api/v1/economic/estimate', {
      params: { crop_names: cropNames, area_ha: areaHa }
    })
    return res.data
  },
}
