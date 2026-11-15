import client from './client'

export interface PriorityWeights {
  id: number
  user_id: number
  weight_environmental: number
  weight_social: number
  weight_economic: number
  priority_water_conservation: number
  priority_soil_recovery: number
  priority_income_increase: number
  priority_cost_reduction: number
  priority_food_security: number
  priority_diversification: number
  priority_risk_reduction: number
  priority_easy_management: number
}

export const prioritiesApi = {
  get: async (): Promise<PriorityWeights> => {
    const res = await client.get<PriorityWeights>('/api/v1/priorities')
    return res.data
  },

  update: async (data: Omit<PriorityWeights, 'id' | 'user_id'>): Promise<PriorityWeights> => {
    const res = await client.put<PriorityWeights>('/api/v1/priorities', data)
    return res.data
  },
}
