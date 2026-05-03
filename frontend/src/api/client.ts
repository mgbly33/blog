import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const normalizeApiBaseUrl = (rawBaseUrl?: string): string => {
  const value = (rawBaseUrl || '').trim()
  if (!value) return '/api'

  const trimmed = value.replace(/\/+$/, '')
  const withoutApi = trimmed.replace(/\/api$/i, '')
  return `${withoutApi}/api`
}

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: AxiosError) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((pending) => {
    if (error) {
      pending.reject(error)
    } else if (token) {
      pending.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const headers = config.headers as Record<string, unknown>
      delete headers['Content-Type']
      delete headers['content-type']
    }

    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && !originalRequest?._retry && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh', { refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = response.data.data

          useAuthStore.getState().setTokens(accessToken, newRefreshToken)
          processQueue(null, accessToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError as AxiosError, null)
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        isRefreshing = false
        processQueue(error, null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const getApiBaseUrl = (): string => apiBaseUrl

export default api
