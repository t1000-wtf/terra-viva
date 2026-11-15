import client from './client'
import type { LoginRequest, RegisterRequest, Token, User } from '../types'

type AuthToken = Token & { user: User }

export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    const res = await client.post<User>('/api/v1/auth/register', {
      name: data.name || data.full_name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: data.role || 'agricultor',
    })
    return res.data
  },

  login: async (data: LoginRequest): Promise<AuthToken> => {
    const res = await client.post<AuthToken>('/api/v1/auth/login', data)
    return res.data
  },
}
