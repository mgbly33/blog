import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { FiCheck, FiX, FiTrash2, FiStar, FiEye, FiFilter, FiClock, FiChevronRight, FiExternalLink } from 'react-icons/fi'
import toast from 'react-hot-toast'
import MDEditor from '@uiw/react-md-editor'
import { adminApi, BlogAdminView } from '@/api/admin'
import { blogApi } from '@/api/blog'
import { invalidateBlogCollections } from '@/utils/queryInvalidation'
import StateCard from '@/components/ui/StateCard'
import { REVIEW_STATUS_META } from '@/constants/reviewStatus'

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: REVIEW_STATUS_META.PENDING.label, color: REVIEW_STATUS_META.PENDING.badgeClass },
  APPROVED: { label: REVIEW_STATUS_META.APPROVED.label, color: REVIEW_STATUS_META.APPROVED.badgeClass },
  REJECTED: { label: REVIEW_STATUS_META.REJECTED.label, color: REVIEW_STATUS_META.REJECTED.badgeClass },
  SCHEDULED: { label: REVIEW_STATUS_META.SCHEDULED.label, color: REVIEW_STATUS_META.SCHEDULED.badgeClass },
  ARCHIVED: { label: REVIEW_STATUS_META.ARCHIVED.label, color: 'bg-gray-100 text-gray-600' },
}

export default function BlogManagement() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const status = searchParams.get('status') || ''
  const isReviewMode = status === 'PENDING'

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'blogs', page, status],
    queryFn: async () => {
      const response = await adminApi.getBlogs(page, 20, status || undefined)
      return response.data
    },
    refetchInterval: 10000,
  })

  const pendingList = useMemo(
    () => (data?.content || []).filter((blog) => blog.status === 'PENDING'),
    [data?.content],
  )

  useEffect(() => {
    if (!isReviewMode) {
      return
    }

    if (pendingList.length === 0) {
      setSelectedBlogId(null)
      return
    }

    if (!selectedBlogId || !pendingList.some((blog) => blog.id === selectedBlogId)) {
      setSelectedBlogId(pendingList[0].id)
    }
  }, [isReviewMode, pendingList, selectedBlogId])

  const selectedSummary = pendingList.find((blog) => blog.id === selectedBlogId)

  const {
    data: selectedBlogData,
    isLoading: selectedLoading,
    isError: selectedError,
  } = useQuery({
    queryKey: ['admin', 'blog-preview', selectedBlogId],
    queryFn: () => blogApi.getBlog(selectedBlogId!),
    enabled: isReviewMode && Boolean(selectedBlogId),
  })

  const statusMutation = useMutation({
    mutationFn: ({
      blogId,
      status,
      rejectReason,
    }: {
      blogId: string
      status: 'APPROVED' | 'REJECTED'
      rejectReason?: string
    }) => adminApi.updateBlogStatus(blogId, status, rejectReason),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'APPROVED' ? '文章已通过审核' : '文章已标记为未通过')
      setRejectReason('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog-preview'] })
      invalidateBlogCollections(queryClient)
    },
    onError: () => toast.error('操作失败'),
  })

  const stickyMutation = useMutation({
    mutationFn: (blogId: string) => adminApi.toggleSticky(blogId),
    onSuccess: () => {
      toast.success('置顶状态已更新')
      queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog-preview'] })
      invalidateBlogCollections(queryClient)
    },
    onError: () => toast.error('操作失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: (blogId: string) => adminApi.deleteBlog(blogId),
    onSuccess: () => {
      toast.success('文章已删除')
      queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog-preview'] })
      invalidateBlogCollections(queryClient)
    },
    onError: () => toast.error('删除失败'),
  })

  const handleDelete = (blog: BlogAdminView) => {
    if (confirm(`确定要删除文章 "${blog.title}" 吗？此操作不可撤销！`)) {
      deleteMutation.mutate(blog.id)
    }
  }

  const handleStatusFilter = (newStatus: string) => {
    if (newStatus) {
      setSearchParams({ status: newStatus })
    } else {
      setSearchParams({})
    }
    setPage(0)
  }

  const approveCurrent = () => {
    if (!selectedBlogId) return
    statusMutation.mutate({ blogId: selectedBlogId, status: 'APPROVED' })
  }

  const rejectCurrent = () => {
    if (!selectedBlogId) return
    if (!rejectReason.trim()) {
      toast.error('请填写拒绝原因，便于作者修改')
      return
    }
    statusMutation.mutate({
      blogId: selectedBlogId,
      status: 'REJECTED',
      rejectReason: rejectReason.trim(),
    })
  }

  return (
    <div className="page-shell">
      <section className="panel-surface">
        <h1 className="section-title">文章管理</h1>
        <p className="section-subtitle">管理和审核所有文章，待审核模式使用双栏快速处理。</p>
      </section>

      <section className="panel-surface">
        <div className="flex flex-wrap items-center gap-2">
          <FiFilter className="text-gray-400" />
          <span className="text-sm text-gray-500">状态筛选:</span>
          <div className="flex flex-wrap gap-2">
            <FilterButton currentStatus={status} status="" label="全部" onClick={handleStatusFilter} />
            <FilterButton currentStatus={status} status="PENDING" label={REVIEW_STATUS_META.PENDING.label} onClick={handleStatusFilter} />
            <FilterButton currentStatus={status} status="APPROVED" label={REVIEW_STATUS_META.APPROVED.label} onClick={handleStatusFilter} />
            <FilterButton currentStatus={status} status="REJECTED" label={REVIEW_STATUS_META.REJECTED.label} onClick={handleStatusFilter} />
            <FilterButton currentStatus={status} status="SCHEDULED" label={REVIEW_STATUS_META.SCHEDULED.label} onClick={handleStatusFilter} />
            <FilterButton currentStatus={status} status="ARCHIVED" label={REVIEW_STATUS_META.ARCHIVED.label} onClick={handleStatusFilter} />
          </div>
        </div>
      </section>

      {isReviewMode ? (
        <ReviewMode
          isLoading={isLoading}
          pendingList={pendingList}
          selectedBlogId={selectedBlogId}
          setSelectedBlogId={setSelectedBlogId}
          selectedSummary={selectedSummary}
          selectedBlogData={selectedBlogData?.data}
          selectedLoading={selectedLoading}
          selectedError={selectedError}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          approveCurrent={approveCurrent}
          rejectCurrent={rejectCurrent}
          statusPending={statusMutation.isPending}
          onToggleSticky={(id) => stickyMutation.mutate(id)}
          onDeleteBlog={handleDelete}
        />
      ) : (
        <NormalTable
          isLoading={isLoading}
          data={data}
          page={page}
          setPage={setPage}
          onApprove={(blogId) => statusMutation.mutate({ blogId, status: 'APPROVED' })}
          onReject={(blogId) => statusMutation.mutate({ blogId, status: 'REJECTED', rejectReason: '未通过审核' })}
          onToggleSticky={(blogId) => stickyMutation.mutate(blogId)}
          handleDelete={handleDelete}
        />
      )}
    </div>
  )
}

function FilterButton({
  currentStatus,
  status,
  label,
  onClick,
}: {
  currentStatus: string
  status: string
  label: string
  onClick: (status: string) => void
}) {
  const active = currentStatus === status
  return (
    <button
      type="button"
      onClick={() => onClick(status)}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

function ReviewMode({
  isLoading,
  pendingList,
  selectedBlogId,
  setSelectedBlogId,
  selectedSummary,
  selectedBlogData,
  selectedLoading,
  selectedError,
  rejectReason,
  setRejectReason,
  approveCurrent,
  rejectCurrent,
  statusPending,
  onToggleSticky,
  onDeleteBlog,
}: {
  isLoading: boolean
  pendingList: BlogAdminView[]
  selectedBlogId: string | null
  setSelectedBlogId: (id: string) => void
  selectedSummary?: BlogAdminView
  selectedBlogData?: any
  selectedLoading: boolean
  selectedError: boolean
  rejectReason: string
  setRejectReason: (v: string) => void
  approveCurrent: () => void
  rejectCurrent: () => void
  statusPending: boolean
  onToggleSticky: (id: string) => void
  onDeleteBlog: (blog: BlogAdminView) => void
}) {
  if (isLoading) {
    return <StateCard type="loading" title="待审核列表加载中" />
  }

  if (pendingList.length === 0) {
    return <StateCard type="empty" title="当前没有待审核文章" description="审核队列已清空。" />
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
      <aside className="panel-surface p-0 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600">待审核队列（{pendingList.length}）</div>
        <div className="max-h-[72vh] overflow-y-auto">
          {pendingList.map((blog) => {
            const active = blog.id === selectedBlogId
            return (
              <button
                key={blog.id}
                type="button"
                onClick={() => setSelectedBlogId(blog.id)}
                className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors ${
                  active ? 'bg-primary-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium text-gray-800">{blog.title}</p>
                  <FiChevronRight className="mt-0.5 flex-shrink-0 text-gray-400" size={16} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{blog.author?.username || '未知作者'}</span>
                  <span>{new Date(blog.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="panel-surface">
        {selectedLoading ? (
          <StateCard type="loading" title="预览加载中" className="py-10" />
        ) : selectedError || !selectedBlogData || !selectedSummary ? (
          <StateCard type="error" title="预览加载失败" description="请选择其他文章重试" className="py-10" />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedSummary.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="status-chip bg-yellow-100 text-yellow-700">待审核</span>
                  <span>作者：{selectedSummary.author?.username || '未知'}</span>
                  <span>发布时间：{new Date(selectedSummary.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
              <Link
                to={`/blog/${selectedSummary.id}`}
                target="_blank"
                className="btn btn-secondary btn-sm"
              >
                <FiExternalLink size={14} />
                新窗口查看
              </Link>
            </div>

            {selectedBlogData.image && (
              <img src={selectedBlogData.image} alt={selectedSummary.title} className="h-56 w-full rounded-lg object-cover" />
            )}

            <div className="text-sm text-gray-600">{selectedBlogData.summary || '暂无摘要'}</div>

            <div data-color-mode="light" className="rounded-lg border border-gray-100 p-3">
              <div className="max-h-[360px] overflow-y-auto prose prose-sm max-w-none">
                <MDEditor.Markdown source={selectedBlogData.rawContent || selectedBlogData.content || ''} />
              </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-red-100 bg-red-50/40 p-3">
              <label className="text-sm font-medium text-gray-700" htmlFor="reject-reason">拒绝原因（拒绝时必填）</label>
              <textarea
                id="reject-reason"
                className="input min-h-[90px] resize-y"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例如：标题与正文不一致、内容质量不足、含违规内容..."
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={approveCurrent}
                  disabled={statusPending}
                  className="btn btn-primary btn-sm"
                >
                  <FiCheck size={14} />
                  通过审核
                </button>
                <button
                  type="button"
                  onClick={rejectCurrent}
                  disabled={statusPending}
                  className="btn btn-danger btn-sm"
                >
                  <FiX size={14} />
                  拒绝并通知作者
                </button>
                <button
                  type="button"
                  onClick={() => onToggleSticky(selectedSummary.id)}
                  className="btn btn-secondary btn-sm"
                >
                  <FiStar size={14} />
                  切换置顶
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteBlog(selectedSummary)}
                  className="btn btn-danger btn-sm"
                >
                  <FiTrash2 size={14} />
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function NormalTable({
  isLoading,
  data,
  page,
  setPage,
  onApprove,
  onReject,
  onToggleSticky,
  handleDelete,
}: {
  isLoading: boolean
  data: any
  page: number
  setPage: Dispatch<SetStateAction<number>>
  onApprove: (blogId: string) => void
  onReject: (blogId: string) => void
  onToggleSticky: (blogId: string) => void
  handleDelete: (blog: BlogAdminView) => void
}) {
  return (
    <div className="panel-surface overflow-hidden p-0">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文章</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作者</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数据</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">加载中...</td>
            </tr>
          ) : data?.content.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">暂无文章</td>
            </tr>
          ) : (
            data?.content.map((blog: BlogAdminView & { publishAt?: string }) => (
              <tr key={blog.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="max-w-sm">
                    <Link to={`/blog/${blog.id}`} target="_blank" className="line-clamp-1 font-medium text-gray-800 hover:text-primary-600">
                      {blog.title}
                    </Link>
                    <p className="mt-1 line-clamp-1 text-sm text-gray-500">{blog.summary}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {blog.author ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={blog.author.avatar || `https://ui-avatars.com/api/?name=${blog.author.username}`}
                        alt={blog.author.username}
                        className="h-8 w-8 rounded-full"
                      />
                      <span className="text-sm text-gray-700">{blog.author.username}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">未知</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`status-chip ${(statusLabels[blog.status] || statusLabels.PENDING).color}`}>
                    {(statusLabels[blog.status] || { label: blog.status }).label}
                  </span>
                  {blog.status === 'SCHEDULED' && blog.publishAt && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-blue-500">
                      <FiClock size={10} />
                      {new Date(blog.publishAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <FiEye size={14} />
                      {blog.views}
                    </span>
                    <span>❤️ {blog.likesCount}</span>
                    <span>💬 {blog.commentCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {blog.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => onApprove(blog.id)}
                          className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50"
                          title="通过审核"
                        >
                          <FiCheck size={18} />
                        </button>
                        <button
                          onClick={() => onReject(blog.id)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                          title="拒绝"
                        >
                          <FiX size={18} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onToggleSticky(blog.id)}
                      className="rounded-lg p-2 text-yellow-600 transition-colors hover:bg-yellow-50"
                      title="切换置顶"
                    >
                      <FiStar size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(blog)}
                      className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                      title="删除文章"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="text-sm text-gray-500">共 {data.totalElements} 条记录，第 {page + 1} / {data.totalPages} 页</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={data.first}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data.last}
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
