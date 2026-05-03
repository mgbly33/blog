import api from './client'
import type { ApiResponse, Category, Tag } from '@/types'

export const categoryApi = {
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories')
    return response.data
  },

  getById: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/${id}`)
    return response.data
  },
}

export const tagApi = {
  getAll: async (): Promise<ApiResponse<Tag[]>> => {
    const response = await api.get('/tags')
    return response.data
  },

  getHot: async (): Promise<ApiResponse<Tag[]>> => {
    const response = await api.get('/tags/hot')
    return response.data
  },

  getPopular: async (): Promise<ApiResponse<Tag[]>> => {
    const response = await api.get('/tags/popular')
    return response.data
  },

  getById: async (id: string): Promise<ApiResponse<Tag>> => {
    const response = await api.get(`/tags/${id}`)
    return response.data
  },
}

