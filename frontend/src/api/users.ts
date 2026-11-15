import client from './client'
import type { User, FarmerProfileFull } from '../types'

export const usersApi = {
  getUserProfile: async (): Promise<User> => {
    const res = await client.get<User>('/api/v1/users/profile')
    return res.data
  },

  updateUserProfile: async (data: { name?: string; phone?: string; role?: string }): Promise<User> => {
    const res = await client.put<User>('/api/v1/users/profile', data)
    return res.data
  },

  getFarmerProfile: async (): Promise<FarmerProfileFull> => {
    const res = await client.get<FarmerProfileFull>('/api/v1/users/farmer-profile')
    return res.data
  },

  updateFarmerProfile: async (data: Partial<FarmerProfileFull>): Promise<FarmerProfileFull> => {
    const res = await client.put<FarmerProfileFull>('/api/v1/users/farmer-profile', data)
    return res.data
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await client.get<User>('/api/v1/users/profile')
    return res.data
  },

  updateCurrentUser: async (data: Partial<User>): Promise<User> => {
    const res = await client.put<User>('/api/v1/users/profile', data)
    return res.data
  },

  getProfile: async (): Promise<FarmerProfileFull> => {
    const res = await client.get<FarmerProfileFull>('/api/v1/users/farmer-profile')
    return res.data
  },

  updateProfile: async (data: Partial<FarmerProfileFull>): Promise<FarmerProfileFull> => {
    const res = await client.put<FarmerProfileFull>('/api/v1/users/farmer-profile', data)
    return res.data
  },
}
