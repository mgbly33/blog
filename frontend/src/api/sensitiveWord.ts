import api from './client'
import type { ApiResponse } from '@/types'

export interface SensitiveWordItem {
  id: string
  word: string
  level: 'WARN' | 'BLOCK' | 'REVIEW'
  category: string | null
  createdAt: string
}

export interface SensitiveWordPage {
  content: SensitiveWordItem[]
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface CheckResult {
  passed: boolean
  matchCount: number
  matches: Array<{
    word: string
    level: string
    startIndex: number
  }>
  highestLevel: string | null
}

export const sensitiveWordApi = {
  // 鑾峰彇鏁忔劅璇嶅垪琛?
  getWords: async (page = 0, size = 20, category?: string): Promise<ApiResponse<SensitiveWordPage>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (category) params.append('category', category)
    const response = await api.get(`/admin/sensitive-words?${params}`)
    return response.data
  },

  // 娣诲姞鏁忔劅璇?
  addWord: async (data: { word: string; level?: string; category?: string }): Promise<ApiResponse<SensitiveWordItem>> => {
    const response = await api.post('/admin/sensitive-words', data)
    return response.data
  },

  // 鎵归噺娣诲姞
  batchAddWords: async (data: { words: string[]; level?: string; category?: string }): Promise<ApiResponse<number>> => {
    const response = await api.post('/admin/sensitive-words/batch', data)
    return response.data
  },

  // 鏇存柊鏁忔劅璇?
  updateWord: async (id: string, data: { word?: string; level?: string; category?: string }): Promise<ApiResponse<SensitiveWordItem>> => {
    const response = await api.put(`/admin/sensitive-words/${id}`, data)
    return response.data
  },

  // 鍒犻櫎鏁忔劅璇?
  deleteWord: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/admin/sensitive-words/${id}`)
    return response.data
  },

  // 鏂囨湰妫€娴?
  checkText: async (text: string): Promise<ApiResponse<CheckResult>> => {
    const response = await api.post('/admin/sensitive-words/check', { text })
    return response.data
  },

  // 閲嶆柊鍔犺浇杩囨护鍣?
  reloadFilter: async (): Promise<ApiResponse<{ wordCount: number }>> => {
    const response = await api.post('/admin/sensitive-words/reload')
    return response.data
  },
}

