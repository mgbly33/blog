import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FiClock, FiTrash2, FiBook } from 'react-icons/fi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { historyApi, ReadHistoryItem } from '@/api/history'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default function ReadHistory() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['read-history', page],
    queryFn: () => historyApi.getHistory(page, 20),
  })

  const deleteMutation = useMutation({
    mutationFn: (blogId: string) => historyApi.deleteHistory(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['read-history'] })
      toast.success('记录已删除')
    },
    onError: () => toast.error('删除失败'),
  })

  const historyData = data?.data
  const items: ReadHistoryItem[] = historyData?.content || []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">阅读历史</h1>
        <p className="text-gray-500 mt-1">继续你未完成的阅读</p>
      </div>

      {isLoading ? (
        <div className="card text-center py-12 text-gray-500">加载中...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <FiBook size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">还没有阅读记录</p>
          <p className="text-gray-400 text-sm mt-1">浏览文章后会自动记录阅读进度</p>
          <Link to="/" className="btn btn-primary mt-4 inline-block">去看文章</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card hover:shadow-hover transition-shadow">
              <div className="flex items-start gap-4">
                {/* Cover Image */}
                {item.blogImage ? (
                  <Link to={`/blog/${item.blogId}`} className="flex-shrink-0">
                    <img
                      src={item.blogImage}
                      alt={item.blogTitle}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  </Link>
                ) : (
                  <Link
                    to={`/blog/${item.blogId}`}
                    className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center flex-shrink-0"
                  >
                    <FiBook size={24} className="text-primary-300" />
                  </Link>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/blog/${item.blogId}`}
                    className="font-medium text-gray-800 hover:text-primary-600 transition-colors line-clamp-1"
                  >
                    {item.blogTitle}
                  </Link>
                  {item.blogSummary && (
                    <p className="text-sm text-gray-400 line-clamp-1 mt-1">{item.blogSummary}</p>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-400 rounded-full transition-all"
                          style={{ width: `${item.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{item.progress || 0}%</span>
                    </div>

                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FiClock size={12} />
                      {dayjs(item.lastReadAt).fromNow()}
                    </span>

                    {item.author && (
                      <Link
                        to={`/user/${item.author.username}`}
                        className="text-xs text-gray-400 hover:text-primary-500"
                      >
                        {item.author.username}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    to={`/blog/${item.blogId}`}
                    className="px-3 py-1.5 rounded-lg text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    {item.progress && item.progress >= 100 ? '重新阅读' : '继续阅读'}
                  </Link>
                  <button
                    onClick={() => deleteMutation.mutate(item.blogId)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="删除记录"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {historyData && historyData.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            共 {historyData.totalElements} 条记录
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={historyData.first}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={historyData.last}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
