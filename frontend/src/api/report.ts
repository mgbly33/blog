import api from './client'
import type { ApiResponse } from '@/types'

export interface ReportItem {
  id: string
  reporterId: string
  targetType: 'BLOG' | 'COMMENT' | 'USER'
  targetId: string
  reason: string
  description: string | null
  evidenceUrl: string | null
  status: 'PENDING' | 'RESOLVED' | 'REJECTED'
  adminReply: string | null
  createdAt: string
  resolvedAt: string | null
  reporter?: {
    id: string
    username: string
    avatar: string | null
  }
}

export interface ReportPage {
  content: ReportItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export const reportApi = {
  // 鎻愪氦涓炬姤
  createReport: async (data: {
    targetType: 'BLOG' | 'COMMENT' | 'USER'
    targetId: string
    reason: string
    description?: string
    evidenceUrl?: string
  }): Promise<ApiResponse<ReportItem>> => {
    const response = await api.post('/reports', data)
    return response.data
  },

  // 绠＄悊鍛樿幏鍙栦妇鎶ュ垪琛?
  getReports: async (page = 0, size = 20, status?: string): Promise<ApiResponse<ReportPage>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (status) params.append('status', status)
    const response = await api.get(`/admin/reports?${params}`)
    return response.data
  },

  // 绠＄悊鍛樺鐞嗕妇鎶?
  handleReport: async (id: string, status: 'RESOLVED' | 'REJECTED', adminReply?: string): Promise<ApiResponse<ReportItem>> => {
    const response = await api.put(`/admin/reports/${id}`, { status, adminReply })
    return response.data
  },
}

