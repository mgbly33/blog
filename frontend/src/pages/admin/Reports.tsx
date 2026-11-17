import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { FiCheck, FiX, FiFilter, FiAlertTriangle, FiExternalLink } from 'react-icons/fi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { reportApi, ReportItem } from '@/api/report'

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待处理', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  RESOLVED: { label: '已处理', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  REJECTED: { label: '已驳回', color: 'bg-ink-500/15 text-ink-600 dark:text-ink-300' },
}

const targetTypeLabels: Record<string, string> = {
  BLOG: '文章',
  COMMENT: '评论',
  USER: '用户',
}

export default function Reports() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [adminReply, setAdminReply] = useState('')
  const [handlingId, setHandlingId] = useState<string | null>(null)
  const status = searchParams.get('status') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', page, status],
    queryFn: () => reportApi.getReports(page, 20, status || undefined),
  })

  const handleMutation = useMutation({
    mutationFn: ({ id, status, reply }: { id: string; status: 'RESOLVED' | 'REJECTED'; reply?: string }) =>
      reportApi.handleReport(id, status, reply),
    onSuccess: (_, { status }) => {
      toast.success(status === 'RESOLVED' ? '举报已处理' : '举报已驳回')
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      setHandlingId(null)
      setAdminReply('')
    },
    onError: () => toast.error('操作失败'),
  })

  const reports: ReportItem[] = data?.data?.content || []
  const pageData = data?.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50">
          举报管理
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">审核和处理社区用户提交的举报反馈</p>
      </div>

      <div className="card p-4 hover:transform-none flex flex-wrap items-center gap-2">
        <FiFilter className="text-ink-400" size={14} />
        <span className="text-xs text-ink-500 dark:text-ink-300">处理状态：</span>
        {['', 'PENDING', 'RESOLVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSearchParams(s ? { status: s } : {})
              setPage(0)
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              status === s
                ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900'
                : 'bg-paper-200/70 dark:bg-white/[0.06] text-ink-600 dark:text-ink-300 hover:border-vermilion'
            }`}
          >
            {s === '' ? '全部' : statusLabels[s]?.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-ink-400">加载中...</div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-12 hover:transform-none">
          <FiAlertTriangle size={36} className="mx-auto text-ink-300 dark:text-ink-600 mb-3" />
          <p className="text-sm text-ink-500 dark:text-ink-400">当前筛选下暂无举报记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const st = statusLabels[report.status] || statusLabels.PENDING
            return (
              <div key={report.id} className="card hover:transform-none">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="text-ink-500 dark:text-ink-300">
                        举报对象：
                        <strong className="text-ink-800 dark:text-ink-100 ml-1">
                          {targetTypeLabels[report.targetType] || report.targetType}
                        </strong>{' '}
                        #{report.targetId}
                      </span>
                      {report.targetType === 'BLOG' && (
                        <Link
                          to={`/blog/${report.targetId}`}
                          target="_blank"
                          className="text-vermilion hover:underline inline-flex items-center gap-1"
                        >
                          查看文章 <FiExternalLink size={12} />
                        </Link>
                      )}
                    </div>

                    <div className="text-sm">
                      <span className="font-medium text-ink-700 dark:text-ink-200">原因：</span>
                      <span className="text-rose-600 dark:text-rose-400">{report.reason}</span>
                    </div>

                    {report.description && (
                      <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-300">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-ink-400">
                      {report.reporter && <span>举报人：{report.reporter.username}</span>}
                      <span>{dayjs(report.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                    </div>

                    {report.adminReply && (
                      <div className="mt-2 p-3 rounded-xl bg-paper-200/60 dark:bg-white/[0.04] text-xs text-ink-600 dark:text-ink-300">
                        <strong className="text-ink-800 dark:text-ink-100">处理备注：</strong>{' '}
                        {report.adminReply}
                      </div>
                    )}
                  </div>

                  {(!report.status || report.status === 'PENDING') && (
                    <div className="flex items-center gap-2 shrink-0">
                      {handlingId === report.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={adminReply}
                            onChange={(e) => setAdminReply(e.target.value)}
                            placeholder="处理备注（可选）"
                            className="input text-xs w-44"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleMutation.mutate({
                                id: report.id,
                                status: 'RESOLVED',
                                reply: adminReply,
                              })
                            }
                            className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            title="标记已处理"
                          >
                            <FiCheck size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleMutation.mutate({
                                id: report.id,
                                status: 'REJECTED',
                                reply: adminReply,
                              })
                            }
                            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                            title="驳回举报"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setHandlingId(report.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          处理
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-ink-400">共 {pageData.totalElements} 条</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={pageData.first}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pageData.last}
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
