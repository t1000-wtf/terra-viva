import client from './client'
import type { DashboardSummary } from '../types'

export const dashboardApi = {
  getSummary: async (propertyId: number): Promise<DashboardSummary> => {
    const res = await client.get<DashboardSummary>(`/api/v1/dashboard/summary/${propertyId}`)
    return res.data
  },
}
