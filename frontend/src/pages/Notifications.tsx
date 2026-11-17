import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FiBell,
  FiHeart,
  FiMessageCircle,
  FiUserPlus,
  FiAtSign,
  FiCheck,
  FiCheckCircle,
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { notificationApi } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'
import StateCard from '@/components/ui/StateCard'
import type { Notification } from '@/types'

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'LIKE':
      return <FiHeart className="text-vermilion" size={16} />
    case 'COMMENT':
    case 'REPLY':
      return <FiMessageCircle className="text-ink-800 dark:text-ink-100" size={16} />
    case 'FOLLOW':
      return <FiUserPlus className="text-ink-800 dark:text-ink-100" size={16} />
    case 'MENTION':
      return <FiAtSign className="text-vermilion" size={16} />
    default:
      return <FiBell className="text-ink-400" size={16} />
  }
}

const getNotificationText = (notification: Notification): string => {
  if (notification.content) return notification.content
  switch (notification.type) {
    case 'LIKE':
      return '赞了你的文章'
    case 'COMMENT':
      return '评论了你的文章'
    case 'REPLY':
      return '回复了你的评论'
    case 'FOLLOW':
      return '关注了你'
    case 'MENTION':
      return '在评论中提到了你'
    default:
      return '发来了一条系统通知'
  }
}

export default function Notifications() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationApi.getNotifications(page, 20),
    enabled: isAuthenticated,
  })

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
      toast.success('已全部标为已读')
    },
  })

  if (!isAuthenticated) {
    return (
      <StateCard
        type="empty"
        title="请先登录"
        description="登录后查看你的互动消息通知"
        actionText="前往登录"
        actionTo="/login"
      />
    )
  }

  if (isLoading) {
    return <StateCard type="loading" title="正在加载消息通知..." />
  }

  if (error) {
    return <StateCard type="error" title="无法读取消息通知" />
  }

  const notifications = data?.data.content || []
  const pageInfo = data?.data

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="border-b border-hairline-light dark:border-hairline-dark pb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-editorial-mono uppercase tracking-[0.22em] text-vermilion font-semibold">
            NOTIFICATIONS
          </p>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-50 mt-1">
            互动消息通知
          </h1>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="btn btn-secondary btn-sm"
          >
            <FiCheckCircle size={14} />
            <span>全部标为已读</span>
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <StateCard type="empty" title="暂无新消息通知" />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: Notification) => (
            <div
              key={notification.id}
              className={`card p-4 flex items-start gap-4 hover:transform-none ${
                notification.isRead ? 'opacity-80' : 'border-l-4 border-l-vermilion'
              }`}
            >
              <div className="shrink-0 w-9 h-9 rounded-full border border-hairline-light dark:border-hairline-dark bg-paper-100 dark:bg-white/[0.05] flex items-center justify-center">
                <NotificationIcon type={notification.type} />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="text-sm text-ink-800 dark:text-ink-100">
                  {notification.sender && (
                    <Link
                      to={`/user/${notification.sender.username}`}
                      className="font-semibold hover:text-vermilion mr-1.5"
                    >
                      {notification.sender.username}
                    </Link>
                  )}
                  <span className="text-ink-600 dark:text-ink-300">
                    {getNotificationText(notification)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-ink-400">
                  <span>
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                  {notification.relatedBlog && (
                    <Link
                      to={`/blog/${notification.relatedBlog}`}
                      className="text-vermilion hover:underline"
                    >
                      查看相关文章 →
                    </Link>
                  )}
                </div>
              </div>

              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => markAsReadMutation.mutate(String(notification.id))}
                  className="p-1.5 text-ink-400 hover:text-vermilion transition-colors"
                  title="标为已读"
                >
                  <FiCheck size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pageInfo && pageInfo.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4 text-xs">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-secondary btn-sm"
          >
            上一页
          </button>
          <span className="text-ink-500">
            第 {page + 1} / {pageInfo.totalPages} 页
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= pageInfo.totalPages}
            className="btn btn-secondary btn-sm"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
