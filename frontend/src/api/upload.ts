import client from './client'
import type { ApiResponse } from '@/types'

export const uploadApi = {
  uploadImage: async (file: File): Promise<ApiResponse<string>> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await client.post('/upload', formData)
    return response.data
  },
}

