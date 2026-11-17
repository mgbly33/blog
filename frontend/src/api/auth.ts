import api from './client'
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'

export interface UserProfile extends User {
  blogCount?: number
  likeCount?: number
  likedCount?: number
  receivedLikeCount?: number
}

export interface UpdateProfileRequest {
  bio?: string
  avatar?: string
}

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/logout')
    return response.data
  },
}

export const userApi = {
  getProfile: async (username: string): Promise<ApiResponse<UserProfile>> => {
    const response = await api.get(`/users/username/${encodeURIComponent(username)}`)
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/me', data)
    return response.data
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/users/me')
    return response.data
  },
}

