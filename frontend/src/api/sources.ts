import client from './client'

export interface ScientificSource {
  name: string
  organization?: string
  type?: string
  parameters?: string
  resolution?: string
  coverage?: string
  access_url?: string
  status?: string
}

export const sourcesApi = {
  list: async (): Promise<ScientificSource[]> => {
    const res = await client.get<ScientificSource[]>('/api/v1/sources')
    return res.data
  },
}
