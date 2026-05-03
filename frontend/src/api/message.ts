import api from './client'
import type { ApiResponse } from '@/types'

export interface MessageItem {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'SYSTEM'
  isRead: boolean
  createdAt: string
}

export interface ConversationItem {
  partnerId: string
  partner: {
    id: string
    username: string
    avatar: string | null
  }
  lastMessage: string
  lastMessageAt: string
  isLastFromMe: boolean
  unreadCount: number
}

export interface ConversationPage {
  content: MessageItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const messageApi = {
  // 鍙戦€佺淇?
  sendMessage: async (receiverId: string, content: string): Promise<ApiResponse<MessageItem>> => {
    const response = await api.post('/messages', { receiverId, content })
    return response.data
  },

  // 鑾峰彇浼氳瘽鍒楄〃
  getConversations: async (): Promise<ApiResponse<ConversationItem[]>> => {
    const response = await api.get('/messages/conversations')
    return response.data
  },

  // 鑾峰彇涓庢煇浜虹殑瀵硅瘽
  getConversation: async (partnerId: string, page = 0, size = 50): Promise<ApiResponse<ConversationPage>> => {
    const response = await api.get(`/messages/conversation/${partnerId}?page=${page}&size=${size}`)
    return response.data
  },

  // 鑾峰彇鏈鏁?
  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    const response = await api.get('/messages/unread-count')
    return response.data
  },
}

