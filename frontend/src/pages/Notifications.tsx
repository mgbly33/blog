import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FiBell, FiHeart, FiMessageCircle, FiUserPlus, FiAtSign, FiCheck, FiCheckCircle } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { notificationApi } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'
import type { Notification } from '@/types'

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'LIKE':
      return <FiHeart className="text-red-500" size={18} />
    case 'COMMENT':
    case 'REPLY':
      return <FiMessageCircle className="text-blue-500" size={18} />
    case 'FOLLOW':
      return <FiUserPlus className="text-green-500" size={18} />
    case 'MENTION':
      return <FiAtSign className="text-purple-500" size={18} />
    default:
      return <FiBell className="text-gray-500" size={18} />
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
      return '提到了你'
    default:
      return '发送了通知'
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
      toast.success('已全部标记为已读')
    },
  })

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <FiBell size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">请先登录</h2>
        <p className="text-gray-500 mb-4">登录后查看您的通知</p>
        <Link to="/login" className="btn btn-primary">
          去登录
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-20 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-red-500">加载通知失败，请稍后重试</p>
      </div>
    )
  }

  const notifications = data?.data.content || []
  const pageInfo = data?.data

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">通知</h1>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="btn btn-secondary text-sm"
          >
            <FiCheckCircle size={16} />
            <span>全部已读</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <FiBell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification: Notification) => (
            <div
              key={notification.id}
              className={`card flex items-start gap-4 transition-colors ${
                notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-100'
              }`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <NotificationIcon type={notification.type} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {notification.sender && (
                    <Link
                      to={`/user/${notification.sender.username}`}
                      className="font-medium text-gray-900 hover:text-primary-600"
                    >
                      {notification.sender.username}
                    </Link>
                  )}
                  <span className="text-gray-600">
                    {getNotificationText(notification)}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                  {notification.relatedBlog && (
                    <Link
                      to={`/blog/${notification.relatedBlog}`}
                      className="text-primary-600 hover:underline"
                    >
                      查看文章
                    </Link>
                  )}
                </div>
              </div>

              {!notification.isRead && (
                <button
                  onClick={() => markAsReadMutation.mutate(String(notification.id))}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="标记为已读"
                >
                  <FiCheck size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pageInfo && pageInfo.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-secondary"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-gray-600">
            {page + 1} / {pageInfo.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pageInfo.hasNext}
            className="btn btn-secondary"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
