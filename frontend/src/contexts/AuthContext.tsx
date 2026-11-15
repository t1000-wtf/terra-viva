import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import { usersApi } from '../api/users'
import { authApi } from '../api/auth'
import type { LoginRequest, RegisterRequest } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
  refreshUser: () => Promise<void>
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await usersApi.getUserProfile()
      setUser(me)
    } catch {
      setUser(null)
      localStorage.removeItem('terraviva_token')
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('terraviva_token')
    if (token) {
      refreshUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [refreshUser])

  const logout = () => {
    localStorage.removeItem('terraviva_token')
    setUser(null)
  }

  const login = async (credentials: LoginRequest) => {
    const result = await authApi.login(credentials)
    localStorage.setItem('terraviva_token', result.access_token)
    setUser(result.user)
  }

  const register = async (data: RegisterRequest) => {
    await authApi.register(data)
    await login({ email: data.email, password: data.password })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
        login,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
