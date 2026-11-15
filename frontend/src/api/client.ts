import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT_MS = 15_000
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000]
const BACKEND_STATUS_EVENT = 'terraviva:backend-status'

export type BackendStatus = { kind: 'starting' | 'unavailable'; message: string } | null

function emitBackendStatus(status: BackendStatus) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<BackendStatus>(BACKEND_STATUS_EVENT, { detail: status }))
  }
}

export function getBackendStatusEventName() {
  return BACKEND_STATUS_EVENT
}

export const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT_MS,
})

// Retry transient GET failures one at a time. Mutations are never replayed automatically.
client.interceptors.response.use(
  (response) => {
    emitBackendStatus(null)
    return response
  },
  async (error) => {
    const config = error.config
    const isReadRequest = config?.method?.toLowerCase() === 'get'
    const transientHttpError = [502, 503, 504].includes(error.response?.status)
    const transientConnectionError = !error.response && (
      error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ERR_NETWORK'
    )
    const transient = transientHttpError || transientConnectionError

    if (transient) {
      emitBackendStatus({
        kind: 'starting',
        message: 'Servidor iniciando, aguarde alguns instantes...',
      })
    }

    if (isReadRequest && transient && config) {
      const retryConfig = config as typeof config & { __terravivaRetryCount?: number }
      const retryCount = retryConfig.__terravivaRetryCount ?? 0
      if (retryCount < RETRY_DELAYS_MS.length) {
        retryConfig.__terravivaRetryCount = retryCount + 1
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[retryCount]))
        return client.request(config)
      }
    }

    if (transient) {
      emitBackendStatus({
        kind: 'unavailable',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      })
    } else if (error.response) {
      emitBackendStatus({
        kind: 'unavailable',
        message: error.response.data?.detail || `O servidor respondeu com erro (${error.response.status}).`,
      })
    }

    return Promise.reject(error)
  },
)

export default client
