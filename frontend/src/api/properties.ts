import client from './client'
import type { Property, PropertyCreate, PaginationParams } from '../types'

export const propertiesApi = {
  list: async (params?: PaginationParams): Promise<Property[]> => {
    const res = await client.get<any>('/api/v1/properties', { params })
    if (Array.isArray(res.data)) return res.data
    if (res.data && Array.isArray(res.data.items)) return res.data.items
    return []
  },

  listAll: async (): Promise<Property[]> => {
    return propertiesApi.list()
  },

  get: async (id: number): Promise<Property> => {
    const res = await client.get<Property>(`/api/v1/properties/${id}`)
    return res.data
  },

  create: async (data: PropertyCreate): Promise<Property> => {
    const res = await client.post<Property>('/api/v1/properties', data)
    return res.data
  },

  update: async (id: number, data: Partial<PropertyCreate>): Promise<Property> => {
    const res = await client.put<Property>(`/api/v1/properties/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/api/v1/properties/${id}`)
  },
}
