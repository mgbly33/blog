import api from './client'
import type { ApiResponse, User, PageResponse, Notification } from '@/types'

export interface UpdateProfileRequest {
  bio?: string
  avatar?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

interface NotificationPayload extends Omit<Notification, 'relatedBlog' | 'relatedComment'> {
  relatedBlogId: string | null
  relatedCommentId: string | null
}

const normalizeNotification = (notification: NotificationPayload): Notification => ({
  ...notification,
  relatedBlog: notification.relatedBlogId,
  relatedComment: notification.relatedCommentId,
})

export const userApi = {
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/users/me')
    return response.data
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  getUserByUsername: async (username: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/username/${username}`)
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/me', data)
    return response.data
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<null>> => {
    const response = await api.post('/users/me/password', data)
    return response.data
  },

  toggleFollow: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.post(`/users/${userId}/follow`)
    return response.data
  },

  getFollowers: async (userId: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<User>>> => {
    const response = await api.get(`/users/${userId}/followers?page=${page}&size=${size}`)
    return response.data
  },

  getFollowing: async (userId: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<User>>> => {
    const response = await api.get(`/users/${userId}/following?page=${page}&size=${size}`)
    return response.data
  },
}

export const notificationApi = {
  getNotifications: async (page = 0, size = 20): Promise<ApiResponse<PageResponse<Notification>>> => {
    const response = await api.get<ApiResponse<PageResponse<NotificationPayload>>>(
      `/users/notifications?page=${page}&size=${size}`
    )

    return {
      ...response.data,
      data: {
        ...response.data.data,
        content: response.data.data.content.map(normalizeNotification),
      },
    }
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get('/users/notifications/unread-count')
    return response.data
  },

  markAsRead: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/users/notifications/${id}/read`)
    return response.data
  },

  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/users/notifications/read-all')
    return response.data
  },
}

