import client from './client'
import type {
  EnvironmentalSyncResponse,
  EnvironmentalTimeseriesResponse
} from '../types'

export const environmentalApi = {
  sync: async (propertyId: number, days: number = 30): Promise<EnvironmentalSyncResponse> => {
    const res = await client.post<EnvironmentalSyncResponse>(`/api/v1/environmental/sync/${propertyId}`, null, {
      params: { days }
    })
    return res.data
  },

  getTimeseries: async (propertyId: number, days: number = 30): Promise<EnvironmentalTimeseriesResponse> => {
    const res = await client.get<EnvironmentalTimeseriesResponse>(`/api/v1/environmental/timeseries/${propertyId}`, {
      params: { days }
    })
    return res.data
  },
}
