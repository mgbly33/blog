import api from './client'
import type { ApiResponse, Draft, DraftListItem, PageResponse } from '@/types'

export interface SaveDraftRequest {
  title?: string
  content?: string
  category?: string
  tags?: string[]
  visibility?: string
  image?: string
  blogId?: string
}

export interface DraftVersion {
  id: string
  draftId: string
  version: number
  title: string
  content: string
  wordCount: number
  createdAt: string
}

export const draftApi = {
  getDrafts: async (page = 0, size = 10): Promise<ApiResponse<PageResponse<DraftListItem>>> => {
    const response = await api.get(`/drafts?page=${page}&size=${size}`)
    return response.data
  },

  getDraft: async (id: string): Promise<ApiResponse<Draft>> => {
    const response = await api.get(`/drafts/${id}`)
    return response.data
  },

  getDraftByBlogId: async (blogId: string): Promise<ApiResponse<Draft>> => {
    const response = await api.get(`/drafts/blog/${blogId}`)
    return response.data
  },

  saveDraft: async (data: SaveDraftRequest): Promise<ApiResponse<Draft>> => {
    const response = await api.post('/drafts', data)
    return response.data
  },

  updateDraft: async (id: string, data: SaveDraftRequest): Promise<ApiResponse<Draft>> => {
    const response = await api.put(`/drafts/${id}`, data)
    return response.data
  },

  deleteDraft: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/drafts/${id}`)
    return response.data
  },

  getVersionHistory: async (draftId: string): Promise<ApiResponse<DraftVersion[]>> => {
    const response = await api.get(`/drafts/${draftId}/versions`)
    return response.data
  },

  getVersion: async (draftId: string, version: number): Promise<ApiResponse<DraftVersion>> => {
    const response = await api.get(`/drafts/${draftId}/versions/${version}`)
    return response.data
  },

  restoreVersion: async (draftId: string, version: number): Promise<ApiResponse<Draft>> => {
    const response = await api.post(`/drafts/${draftId}/versions/${version}/restore`)
    return response.data
  },
}

