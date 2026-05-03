import api from './client'
import type { ApiResponse, Comment, PageResponse } from '@/types'

export interface CreateCommentRequest {
  blogId: string
  content: string
  parentCommentId?: string
}

export const commentApi = {
  getComments: async (blogId: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<Comment>>> => {
    const response = await api.get(`/comments/blog/${blogId}?page=${page}&size=${size}`)
    return response.data
  },

  getReplies: async (commentId: string): Promise<ApiResponse<Comment[]>> => {
    const response = await api.get(`/comments/${commentId}/replies`)
    return response.data
  },

  createComment: async (data: CreateCommentRequest): Promise<ApiResponse<Comment>> => {
    const response = await api.post('/comments', data)
    return response.data
  },

  deleteComment: async (commentId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/comments/${commentId}`)
    return response.data
  },

  likeComment: async (commentId: string): Promise<ApiResponse<Comment>> => {
    const response = await api.post(`/comments/${commentId}/like`)
    return response.data
  },
}
