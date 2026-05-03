import api from './client'
import type { ApiResponse, Blog, BlogListItem, PageResponse, Draft } from '@/types'

export interface CreateBlogRequest {
  title: string
  content: string
  summary?: string
  image?: string
  category?: string
  tags?: string[]
  status?: 'PUBLISHED' | 'DRAFT'
  publishAt?: string | null
  unpublishAt?: string | null
}

export interface UpdateBlogRequest {
  title?: string
  content?: string
  summary?: string
  image?: string
  category?: string
  tags?: string[]
  status?: 'PUBLISHED' | 'DRAFT'
  publishAt?: string | null
  unpublishAt?: string | null
}

interface SaveDraftRequest {
  id?: string
  title: string
  content: string
}

export const blogApi = {
  getBlogs: async (page = 0, size = 10, categoryId?: string): Promise<ApiResponse<PageResponse<BlogListItem>>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (categoryId) params.append('categoryId', categoryId)
    const response = await api.get(`/blogs?${params}`)
    return response.data
  },

  getBlog: async (id: string): Promise<ApiResponse<Blog>> => {
    const response = await api.get(`/blogs/${id}`)
    return response.data
  },

  getStickyBlogs: async (): Promise<ApiResponse<BlogListItem[]>> => {
    const response = await api.get('/blogs/sticky')
    return response.data
  },

  searchBlogs: async (query: string, page = 0, size = 10): Promise<ApiResponse<PageResponse<BlogListItem>>> => {
    const response = await api.get(`/blogs/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`)
    return response.data
  },

  getBlogsByTag: async (tagId: string, page = 0, size = 10): Promise<ApiResponse<PageResponse<BlogListItem>>> => {
    const response = await api.get(`/blogs/tag/${tagId}?page=${page}&size=${size}`)
    return response.data
  },

  getBlogsByCategory: async (categoryId: string, page = 0, size = 10): Promise<ApiResponse<PageResponse<BlogListItem>>> => {
    const response = await api.get(`/blogs/category/${categoryId}?page=${page}&size=${size}`)
    return response.data
  },

  getUserBlogs: async (username: string, page = 0, size = 10): Promise<ApiResponse<PageResponse<BlogListItem>>> => {
    const response = await api.get(`/blogs/user/username/${username}?page=${page}&size=${size}`)
    return response.data
  },

  getLikedBlogs: async (page = 0, size = 10): Promise<ApiResponse<PageResponse<BlogListItem>>> => {
    const response = await api.get(`/blogs/liked?page=${page}&size=${size}`)
    return response.data
  },

  getBookmarkedBlogs: async (page = 0, size = 10): Promise<ApiResponse<PageResponse<BlogListItem>>> => {
    const response = await api.get(`/blogs/bookmarks?page=${page}&size=${size}`)
    return response.data
  },

  createBlog: async (data: CreateBlogRequest): Promise<ApiResponse<Blog>> => {
    const response = await api.post('/blogs', data)
    return response.data
  },

  updateBlog: async (id: string, data: UpdateBlogRequest): Promise<ApiResponse<Blog>> => {
    const response = await api.put(`/blogs/${id}`, data)
    return response.data
  },

  deleteBlog: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/blogs/${id}`)
    return response.data
  },

  likeBlog: async (id: string): Promise<ApiResponse<Blog>> => {
    const response = await api.post(`/blogs/${id}/like`)
    return response.data
  },

  bookmarkBlog: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/blogs/${id}/bookmark`)
    return response.data
  },

  // Drafts
  getDrafts: async (): Promise<ApiResponse<Draft[]>> => {
    const response = await api.get('/drafts')
    return response.data
  },

  getDraft: async (id: string): Promise<ApiResponse<Draft>> => {
    const response = await api.get(`/drafts/${id}`)
    return response.data
  },

  saveDraft: async (data: SaveDraftRequest): Promise<ApiResponse<Draft>> => {
    if (data.id) {
      const response = await api.put(`/drafts/${data.id}`, data)
      return response.data
    }
    const response = await api.post('/drafts', data)
    return response.data
  },

  deleteDraft: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/drafts/${id}`)
    return response.data
  },
}

