import client from './client'
import type { SocialDiagnosticResponse } from '../types'

export const socialApi = {
  getDiagnostics: async (propertyId: number): Promise<SocialDiagnosticResponse> => {
    const res = await client.get<SocialDiagnosticResponse>(`/api/v1/social/diagnostics/${propertyId}`)
    return res.data
  },
}
