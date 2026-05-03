import api from './client'
import type { ApiResponse, Category, Tag } from '@/types'

// Types
export interface DashboardStats {
  totalUsers: number
  totalBlogs: number
  totalComments: number
  pendingBlogs: number
  bannedUsers: number
  todayViews: number
}

export interface UserListItem {
  id: string
  username: string
  avatar: string
  bio: string
  isAdmin: boolean
  isBanned: boolean
  createdAt: string
}

export interface BlogAdminView {
  id: string
  title: string
  summary: string
  author: {
    id: string
    username: string
    avatar: string
  } | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'ARCHIVED'
  visibility: 'PUBLIC' | 'PRIVATE'
  views: number
  likesCount: number
  commentCount: number
  createdAt: string
}

export interface PageDto<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface OperationLog {
  id: string
  operatorId: string
  operatorName: string
  actionType: string
  targetType: string
  targetId: string
  targetName: string
  description: string
  ipAddress: string
  success: boolean
  errorMessage: string | null
  createdAt: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
}

export interface CreateTagRequest {
  name: string
  color?: string
  isHot?: boolean
}

export interface UpdateTagRequest {
  name?: string
  color?: string
  isHot?: boolean
}

// API
export const adminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/admin/dashboard')
    return response.data
  },

  // User Management
  getUsers: async (page = 0, size = 20, search?: string): Promise<ApiResponse<PageDto<UserListItem>>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (search) params.append('search', search)
    const response = await api.get(`/admin/users?${params}`)
    return response.data
  },

  banUser: async (userId: string, banned: boolean, reason?: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/admin/users/${userId}/ban`, { banned, reason })
    return response.data
  },

  toggleAdmin: async (userId: string, isAdmin: boolean): Promise<ApiResponse<null>> => {
    const response = await api.post(`/admin/users/${userId}/admin`, { isAdmin })
    return response.data
  },

  deleteUser: async (userId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },

  // Blog Management
  getBlogs: async (page = 0, size = 20, status?: string): Promise<ApiResponse<PageDto<BlogAdminView>>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (status) params.append('status', status)
    const response = await api.get(`/admin/blogs?${params}`)
    return response.data
  },

  getPendingBlogs: async (page = 0, size = 20): Promise<ApiResponse<PageDto<BlogAdminView>>> => {
    const response = await api.get(`/admin/blogs/pending?page=${page}&size=${size}`)
    return response.data
  },

  updateBlogStatus: async (blogId: string, status: 'APPROVED' | 'REJECTED', rejectReason?: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/admin/blogs/${blogId}/status`, { status, rejectReason })
    return response.data
  },

  toggleSticky: async (blogId: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/admin/blogs/${blogId}/sticky`)
    return response.data
  },

  deleteBlog: async (blogId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/admin/blogs/${blogId}`)
    return response.data
  },

  // Category Management
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories')
    return response.data
  },

  createCategory: async (data: CreateCategoryRequest): Promise<ApiResponse<Category>> => {
    const response = await api.post('/categories', data)
    return response.data
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<ApiResponse<Category>> => {
    const response = await api.put(`/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  },

  // Tag Management
  getTags: async (): Promise<ApiResponse<Tag[]>> => {
    const response = await api.get('/tags')
    return response.data
  },

  createTag: async (data: CreateTagRequest): Promise<ApiResponse<Tag>> => {
    const response = await api.post('/tags', data)
    return response.data
  },

  updateTag: async (id: string, data: UpdateTagRequest): Promise<ApiResponse<Tag>> => {
    const response = await api.put(`/tags/${id}`, data)
    return response.data
  },

  deleteTag: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/tags/${id}`)
    return response.data
  },

  toggleTagHot: async (id: string): Promise<ApiResponse<Tag>> => {
    const response = await api.post(`/tags/${id}/hot`)
    return response.data
  },

  // Operation Logs
  getLogs: async (
    page = 0,
    size = 20,
    filters?: {
      operatorId?: string
      actionType?: string
      targetType?: string
      startDate?: string
      endDate?: string
      success?: boolean
    }
  ): Promise<ApiResponse<PageDto<OperationLog>>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (filters?.operatorId) params.append('operatorId', filters.operatorId)
    if (filters?.actionType) params.append('actionType', filters.actionType)
    if (filters?.targetType) params.append('targetType', filters.targetType)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.success !== undefined) params.append('success', String(filters.success))
    const response = await api.get(`/admin/logs?${params}`)
    return response.data
  },

  getRecentLogs: async (): Promise<ApiResponse<OperationLog[]>> => {
    const response = await api.get('/admin/logs/recent')
    return response.data
  },

  getLogStatistics: async (): Promise<ApiResponse<{ totalLogs: number; logsToday: number; failedLogs: number; loginCount: number }>> => {
    const response = await api.get('/admin/logs/statistics')
    return response.data
  },

  getActionTypes: async (): Promise<ApiResponse<{ value: string; label: string }[]>> => {
    const response = await api.get('/admin/logs/action-types')
    return response.data
  },

  getTargetTypes: async (): Promise<ApiResponse<{ value: string; label: string }[]>> => {
    const response = await api.get('/admin/logs/target-types')
    return response.data
  },
}

