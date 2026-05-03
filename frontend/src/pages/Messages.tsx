import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { FiSend, FiMessageCircle, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { messageApi, ConversationItem, MessageItem } from '@/api/message'
import { useAuthStore } from '@/stores/authStore'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activePartnerId = searchParams.get('chat')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 获取会话列表
  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageApi.getConversations(),
  })

  // 获取对话详情
  const { data: chatData, isLoading: loadingChat } = useQuery({
    queryKey: ['conversation', activePartnerId],
    queryFn: () => messageApi.getConversation(activePartnerId!),
    enabled: !!activePartnerId,
    refetchInterval: 5000, // 每5秒轮询新消息
  })

  const sendMutation = useMutation({
    mutationFn: () => messageApi.sendMessage(activePartnerId!, newMessage.trim()),
    onSuccess: () => {
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['conversation', activePartnerId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast.error('发送失败'),
  })

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatData])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    sendMutation.mutate()
  }

  const conversations: ConversationItem[] = conversationsData?.data || []
  const messages: MessageItem[] = chatData?.data?.content || []

  // 获取当前聊天对象信息
  const activePartner = conversations.find(c => c.partnerId === activePartnerId)?.partner

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">站内信</h1>

      <div className="card p-0 overflow-hidden" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Conversation List */}
          <div className={`w-80 border-r border-gray-100 flex flex-col ${activePartnerId ? 'hidden md:flex' : 'flex w-full md:w-80'}`}>
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-700">消息列表</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4 text-center text-gray-400">加载中...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <FiMessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">暂无消息</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSearchParams({ chat: conv.partnerId })}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${
                      activePartnerId === conv.partnerId ? 'bg-primary-50' : ''
                    }`}
                  >
                    <img
                      src={conv.partner.avatar || `https://ui-avatars.com/api/?name=${conv.partner.username}`}
                      alt={conv.partner.username}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 text-sm">{conv.partner.username}</span>
                        <span className="text-xs text-gray-400">
                          {conv.lastMessageAt ? dayjs(conv.lastMessageAt).fromNow() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {conv.isLastFromMe ? '我: ' : ''}{conv.lastMessage}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!activePartnerId ? 'hidden md:flex' : 'flex'}`}>
            {activePartnerId ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <button
                    onClick={() => setSearchParams({})}
                    className="md:hidden p-1 text-gray-500"
                  >
                    <FiArrowLeft size={20} />
                  </button>
                  {activePartner && (
                    <Link to={`/user/${activePartner.username}`} className="flex items-center gap-2 hover:text-primary-600">
                      <img
                        src={activePartner.avatar || `https://ui-avatars.com/api/?name=${activePartner.username}`}
                        alt={activePartner.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium text-gray-800">{activePartner.username}</span>
                    </Link>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingChat ? (
                    <div className="text-center text-gray-400 py-8">加载中...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">开始聊天吧！</div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.id
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                              isMe
                                ? 'bg-primary-500 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                              {dayjs(msg.createdAt).format('HH:mm')}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="输入消息..."
                    className="input flex-1"
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    className="btn btn-primary"
                  >
                    <FiSend size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FiMessageCircle size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>选择一个会话开始聊天</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
