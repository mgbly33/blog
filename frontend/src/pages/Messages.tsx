import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { FiSend, FiMail, FiArrowLeft } from 'react-icons/fi'
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
  const activePartnerId = searchParams.get('chat') || searchParams.get('to')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageApi.getConversations(),
  })

  const { data: chatData, isLoading: loadingChat } = useQuery({
    queryKey: ['conversation', activePartnerId],
    queryFn: () => messageApi.getConversation(activePartnerId!),
    enabled: !!activePartnerId,
    refetchInterval: 5000,
  })

  const sendMutation = useMutation({
    mutationFn: () => messageApi.sendMessage(activePartnerId!, newMessage.trim()),
    onSuccess: () => {
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['conversation', activePartnerId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast.error('书简投递失败'),
  })

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
  const activePartner = conversations.find((c) => String(c.partnerId) === String(activePartnerId))?.partner

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="border-b border-hairline-light dark:border-hairline-dark pb-5">
        <p className="text-[10px] font-editorial-mono uppercase tracking-[0.22em] text-vermilion font-semibold">
          DIRECT MESSAGES
        </p>
        <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50 mt-0.5">
          站内私信
        </h1>
      </header>

      <div
        className="card p-0 overflow-hidden"
        style={{ height: '68vh' }}
      >
        <div className="flex h-full">
          {/* Left Correspondence Directory */}
          <div
            className={`w-80 border-r border-hairline-light dark:border-hairline-dark flex flex-col ${
              activePartnerId ? 'hidden md:flex' : 'flex w-full md:w-80'
            }`}
          >
            <div className="px-4 py-3 border-b border-hairline-light dark:border-hairline-dark text-[11px] font-editorial-mono uppercase tracking-widest text-ink-400">
              会话列表 ({conversations.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-hairline-light dark:divide-hairline-dark">
              {loadingConversations ? (
                <div className="p-6 text-center text-xs font-editorial-mono text-ink-400">
                  加载中...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <FiMail size={28} className="mx-auto text-ink-300" />
                  <p className="text-xs text-ink-400">暂无私信记录</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = String(activePartnerId) === String(conv.partnerId)
                  return (
                    <button
                      key={conv.partnerId}
                      type="button"
                      onClick={() => setSearchParams({ chat: conv.partnerId })}
                      className={`w-full flex items-center gap-3 p-4 transition-colors text-left ${
                        isActive
                          ? 'bg-paper-200 dark:bg-ink-700 border-l-2 border-l-vermilion'
                          : 'hover:bg-paper-100 dark:hover:bg-ink-900/40'
                      }`}
                    >
                      <img
                        src={
                          conv.partner.avatar ||
                          `https://ui-avatars.com/api/?name=${conv.partner.username}&background=161615&color=F5F3EE`
                        }
                        alt={conv.partner.username}
                        className="w-9 h-9 rounded-full border border-hairline-light dark:border-hairline-dark object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-ink-900 dark:text-ink-50 text-xs truncate">
                            {conv.partner.username}
                          </span>
                          <span className="font-editorial-mono text-[10px] text-ink-400 shrink-0">
                            {conv.lastMessageAt ? dayjs(conv.lastMessageAt).fromNow() : ''}
                          </span>
                        </div>
                        <p className="text-xs text-ink-500 dark:text-ink-400 truncate mt-0.5">
                          {conv.isLastFromMe ? '你: ' : ''}
                          {conv.lastMessage}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-vermilion text-white text-[10px] font-editorial-mono flex items-center justify-center shrink-0">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Letter Thread */}
          <div className={`flex-1 flex flex-col ${!activePartnerId ? 'hidden md:flex' : 'flex'}`}>
            {activePartnerId ? (
              <>
                <div className="flex items-center gap-3 px-5 py-3 border-b border-hairline-light dark:border-hairline-dark">
                  <button
                    type="button"
                    onClick={() => setSearchParams({})}
                    className="md:hidden p-1 text-ink-500"
                  >
                    <FiArrowLeft size={18} />
                  </button>
                  {activePartner ? (
                    <Link
                      to={`/user/${activePartner.username}`}
                      className="flex items-center gap-2.5 hover:text-vermilion transition-colors"
                    >
                      <img
                        src={
                          activePartner.avatar ||
                          `https://ui-avatars.com/api/?name=${activePartner.username}&background=161615&color=F5F3EE`
                        }
                        alt={activePartner.username}
                        className="w-7 h-7 rounded-full border border-hairline-light dark:border-hairline-dark"
                      />
                      <span className="font-editorial-serif font-bold text-base text-ink-900 dark:text-ink-50">
                        {activePartner.username}
                      </span>
                    </Link>
                  ) : (
                    <span className="font-editorial-mono text-xs text-ink-500">
                      CORRESPONDENT #{activePartnerId}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-paper-100/50 dark:bg-ink-900/30">
                  {loadingChat ? (
                    <div className="text-center text-xs text-ink-400 py-8">
                      加载消息中...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center italic text-sm text-ink-400 py-10">
                      发送第一条私信开始交流吧
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = String(msg.senderId) === String(user?.id)
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm border ${
                              isMe
                                ? 'bg-ink-800 text-paper-50 dark:bg-ink-100 dark:text-ink-900 border-ink-800 dark:border-ink-100'
                                : 'bg-paper-50 dark:bg-ink-800 text-ink-800 dark:text-ink-100 border-hairline-light dark:border-hairline-dark'
                            }`}
                          >
                            <p className="leading-relaxed">{msg.content}</p>
                            <p className="font-editorial-mono text-[10px] opacity-60 mt-1 text-right">
                              {dayjs(msg.createdAt).format('HH:mm')}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="p-3.5 border-t border-hairline-light dark:border-hairline-dark flex gap-2 bg-paper-50/60 dark:bg-ink-800/60"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="输入私信内容..."
                    className="input flex-1 text-sm"
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    className="btn btn-primary"
                  >
                    <FiSend size={14} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-ink-400">
                <div className="text-center space-y-2">
                  <FiMail size={32} className="mx-auto opacity-40" />
                  <p className="text-sm">请从左侧选择一位对话联系人</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
