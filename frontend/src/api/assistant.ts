import client from './client'
import type { ChatRequest, ChatResponse } from '../types'

export interface AssistantHistoryMessage {
  id: number
  role: 'user' | 'assistant'
  message: string
  created_at: string
}

export const assistantApi = {
  sendMessage: async (data: ChatRequest & { property_id?: number }): Promise<ChatResponse> => {
    const res = await client.post<ChatResponse>('/api/v1/assistant/chat', data)
    return res.data
  },

  getHistory: async (propertyId?: number): Promise<AssistantHistoryMessage[]> => {
    const res = await client.get<AssistantHistoryMessage[]>('/api/v1/assistant/history', {
      params: propertyId ? { property_id: propertyId } : undefined,
    })
    return res.data
  },
}
