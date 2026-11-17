import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FiClock, FiTrash2, FiArrowUpRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { historyApi, ReadHistoryItem } from '@/api/history'
import EditorialCover from '@/components/editorial/EditorialCover'
import StateCard from '@/components/ui/StateCard'

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
      toast.success('已删除该条阅读记录')
    },
    onError: () => toast.error('删除失败'),
  })

  const historyData = data?.data
  const items: ReadHistoryItem[] = (historyData?.content || []).filter((item) =>
    Boolean(item?.blogId)
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="border-b border-hairline-light dark:border-hairline-dark pb-6">
        <p className="text-[10px] font-editorial-mono uppercase tracking-[0.22em] text-vermilion font-semibold">
          READING HISTORY
        </p>
        <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-50 mt-1">
          阅读历史与进度
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
          自动记录你的文章阅读进度，随时回顾或继续阅读。
        </p>
      </header>

      {isLoading ? (
        <StateCard type="loading" title="正在加载阅读历史..." />
      ) : items.length === 0 ? (
        <StateCard
          type="empty"
          title="暂无阅读记录"
          description="阅读文章时系统会自动记录你的浏览进度。"
          actionText="返回博客首页"
          actionTo="/"
        />
      ) : (
        <div className="divide-y divide-hairline-light dark:divide-hairline-dark border-b border-hairline-light dark:border-hairline-dark">
          {items.map((item) => {
            const safeTitle = item.blogTitle || '未命名文章'
            return (
              <div
                key={item.id}
                className="py-5 flex flex-col sm:flex-row sm:items-center gap-5 group"
              >
                <Link to={`/blog/${item.blogId}`} className="w-28 shrink-0 hidden sm:block">
                  <EditorialCover
                    src={item.blogImage}
                    title={safeTitle}
                    seed={item.blogId}
                    aspectClass="aspect-[16/10]"
                    compact
                  />
                </Link>

                <div className="flex-1 min-w-0 space-y-2">
                  <Link to={`/blog/${item.blogId}`} className="block">
                    <h3 className="font-editorial-serif text-xl font-bold text-ink-900 dark:text-ink-50 truncate group-hover:text-vermilion transition-colors">
                      {safeTitle}
                    </h3>
                  </Link>

                  {item.blogSummary && (
                    <p className="text-xs text-ink-500 dark:text-ink-400 line-clamp-1">
                      {item.blogSummary}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="flex items-center gap-2.5 w-44">
                      <div className="flex-1 h-1.5 rounded-full bg-paper-200 dark:bg-ink-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-vermilion transition-all"
                          style={{ width: `${item.progress || 0}%` }}
                        />
                      </div>
                      <span className="font-editorial-mono text-[11px] text-ink-500">
                        {item.progress || 0}%
                      </span>
                    </div>

                    <span className="text-xs text-ink-400 flex items-center gap-1">
                      <FiClock size={11} />
                      {dayjs(item.lastReadAt).fromNow()}
                    </span>

                    {item.author && (
                      <Link
                        to={`/user/${item.author.username}`}
                        className="text-xs text-ink-500 hover:text-vermilion"
                      >
                        {item.author.username}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/blog/${item.blogId}`} className="btn btn-secondary btn-sm">
                    <span>{item.progress && item.progress >= 100 ? '重新阅读' : '继续阅读'}</span>
                    <FiArrowUpRight size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.blogId)}
                    className="p-2 text-ink-400 hover:text-rose-600 transition-colors"
                    title="移除记录"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {historyData && historyData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs">
          <span className="text-ink-400">共 {historyData.totalElements} 条记录</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={historyData.first}
              className="btn btn-secondary btn-sm"
            >
              上一页
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={historyData.last}
              className="btn btn-secondary btn-sm"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
