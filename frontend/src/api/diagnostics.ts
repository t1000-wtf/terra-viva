import client from './client'
import type { AlertItemDetail, HolisticDiagnosticResponse } from '../types'

export const diagnosticsApi = {
  getAlerts: async (propertyId: number): Promise<AlertItemDetail[]> => {
    const res = await client.get<AlertItemDetail[]>(`/api/v1/diagnostics/alerts/${propertyId}`)
    return res.data
  },

  getPropertyDiagnostic: async (propertyId: number): Promise<HolisticDiagnosticResponse> => {
    const res = await client.get<HolisticDiagnosticResponse>(`/api/v1/diagnostics/property/${propertyId}`)
    return res.data
  },
}
