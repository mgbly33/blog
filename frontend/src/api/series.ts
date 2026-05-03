import api from './client'
import type { ApiResponse, Series, PageResponse } from '@/types'

export interface CreateSeriesRequest {
  title: string
  description?: string
  coverUrl?: string
}

export interface UpdateSeriesRequest {
  title?: string
  description?: string
  coverUrl?: string
  status?: 'Ongoing' | 'Completed'
}

export const seriesApi = {
  getSeriesList: async (page = 0, size = 20): Promise<ApiResponse<PageResponse<Series>>> => {
    const response = await api.get(`/series?page=${page}&size=${size}`)
    return response.data
  },

  // 鍏煎鍘嗗彶璋冪敤
  getMySeries: async (page = 0, size = 20): Promise<ApiResponse<PageResponse<Series>>> => {
    const response = await api.get(`/series?page=${page}&size=${size}`)
    return response.data
  },

  getSeriesById: async (id: string): Promise<ApiResponse<Series>> => {
    const response = await api.get(`/series/${id}`)
    return response.data
  },

  createSeries: async (data: CreateSeriesRequest): Promise<ApiResponse<Series>> => {
    const response = await api.post('/series', data)
    return response.data
  },

  updateSeries: async (id: string, data: UpdateSeriesRequest): Promise<ApiResponse<Series>> => {
    const response = await api.put(`/series/${id}`, data)
    return response.data
  },

  deleteSeries: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/series/${id}`)
    return response.data
  },
}

