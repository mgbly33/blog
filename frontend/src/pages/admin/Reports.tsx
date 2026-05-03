import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { FiCheck, FiX, FiFilter, FiAlertTriangle, FiExternalLink } from 'react-icons/fi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { reportApi, ReportItem } from '@/api/report'

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  RESOLVED: { label: '已处理', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '已驳回', color: 'bg-gray-100 text-gray-600' },
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
        <h1 className="text-2xl font-bold text-gray-800">举报管理</h1>
        <p className="text-gray-500 mt-1">审核和处理用户举报</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <FiFilter className="text-gray-400" />
        <span className="text-sm text-gray-500">状态:</span>
        {['', 'PENDING', 'RESOLVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => { setSearchParams(s ? { status: s } : {}); setPage(0) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === s ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? '全部' : statusLabels[s]?.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-12">
          <FiAlertTriangle size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">暂无举报</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${(statusLabels[report.status] || statusLabels.PENDING).color}`}>
                      {(statusLabels[report.status] || { label: report.status }).label}
                    </span>
                    <span className="text-sm text-gray-500">
                      举报对象: <strong>{targetTypeLabels[report.targetType] || report.targetType}</strong> #{report.targetId}
                    </span>
                    {report.targetType === 'BLOG' && (
                      <Link to={`/blog/${report.targetId}`} target="_blank" className="text-primary-500 hover:underline text-sm flex items-center gap-1">
                        查看 <FiExternalLink size={12} />
                      </Link>
                    )}
                  </div>

                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">原因: </span>
                    <span className="text-sm text-red-600">{report.reason}</span>
                  </div>

                  {report.description && (
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {report.reporter && (
                      <span>举报人: {report.reporter.username}</span>
                    )}
                    <span>{dayjs(report.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                  </div>

                  {report.adminReply && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                      <strong>管理员回复:</strong> {report.adminReply}
                    </div>
                  )}
                </div>

                {report.status === 'PENDING' && (
                  <div className="flex items-center gap-2 ml-4">
                    {handlingId === report.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          placeholder="回复（可选）"
                          className="input text-sm w-40"
                        />
                        <button
                          onClick={() => handleMutation.mutate({ id: report.id, status: 'RESOLVED', reply: adminReply })}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50"
                          title="处理"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() => handleMutation.mutate({ id: report.id, status: 'REJECTED', reply: adminReply })}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="驳回"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
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
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {pageData.totalElements} 条</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={pageData.first} className="btn btn-secondary btn-sm disabled:opacity-50">上一页</button>
            <button onClick={() => setPage(p => p + 1)} disabled={pageData.last} className="btn btn-secondary btn-sm disabled:opacity-50">下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
