import api, { getApiBaseUrl } from './client'
import type { ApiResponse } from '@/types'
import { useAuthStore } from '@/stores/authStore'

export interface ReadProgress {
  id: string
  blogId: string
  progress: number
  scrollPosition: number
  lastReadAt: string
}

export interface ReadHistoryItem {
  id: string
  blogId: string
  progress: number
  scrollPosition: number
  lastReadAt: string
  blogTitle: string
  blogSummary: string | null
  blogImage: string | null
  readTime: number
  author: {
    id: string
    username: string
    avatar: string | null
  }
}

export interface ReadHistoryPage {
  content: ReadHistoryItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export const historyApi = {
  updateProgress: async (blogId: string, progress: number, scrollPosition: number): Promise<ApiResponse<null>> => {
    const response = await api.post(`/history/${blogId}`, { progress, scrollPosition })
    return response.data
  },

  updateProgressKeepalive: (blogId: string, progress: number, scrollPosition: number): void => {
    const token = useAuthStore.getState().accessToken
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '')
    const url = `${baseUrl}/history/${blogId}`

    void fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ progress, scrollPosition }),
    })
  },

  getProgress: async (blogId: string): Promise<ApiResponse<ReadProgress | null>> => {
    const response = await api.get(`/history/${blogId}`)
    return response.data
  },

  getHistory: async (page = 0, size = 20): Promise<ApiResponse<ReadHistoryPage>> => {
    const response = await api.get(`/history?page=${page}&size=${size}`)
    return response.data
  },

  deleteHistory: async (blogId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/history/${blogId}`)
    return response.data
  },
}
