import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import {
  FiCheck,
  FiX,
  FiTrash2,
  FiStar,
  FiEye,
  FiFilter,
  FiClock,
  FiChevronRight,
  FiExternalLink,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import MDEditor from '@uiw/react-md-editor'
import { adminApi, BlogAdminView } from '@/api/admin'
import { blogApi } from '@/api/blog'
import { useUIStore } from '@/stores/uiStore'
import { invalidateBlogCollections } from '@/utils/queryInvalidation'
import StateCard from '@/components/ui/StateCard'
import { ConfirmModal } from '@/components/ui'
import { REVIEW_STATUS_META } from '@/constants/reviewStatus'

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: REVIEW_STATUS_META.PENDING.label, color: REVIEW_STATUS_META.PENDING.badgeClass },
  APPROVED: { label: REVIEW_STATUS_META.APPROVED.label, color: REVIEW_STATUS_META.APPROVED.badgeClass },
  REJECTED: { label: REVIEW_STATUS_META.REJECTED.label, color: REVIEW_STATUS_META.REJECTED.badgeClass },
  SCHEDULED: { label: REVIEW_STATUS_META.SCHEDULED.label, color: REVIEW_STATUS_META.SCHEDULED.badgeClass },
  ARCHIVED: { label: REVIEW_STATUS_META.ARCHIVED.label, color: REVIEW_STATUS_META.ARCHIVED.badgeClass },
}

export default function BlogManagement() {
  const queryClient = useQueryClient()
  const { theme } = useUIStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deletingBlog, setDeletingBlog] = useState<BlogAdminView | null>(null)
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
    [data?.content]
  )

  useEffect(() => {
    if (!isReviewMode) return
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
      setDeletingBlog(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog-preview'] })
      invalidateBlogCollections(queryClient)
    },
    onError: () => toast.error('删除失败'),
  })

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
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50">
          文章管理
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
          管理和审核全站博客文章，待审核模式支持双栏快速审阅。
        </p>
      </div>

      <section className="card p-4 hover:transform-none">
        <div className="flex flex-wrap items-center gap-2">
          <FiFilter className="text-ink-400" size={14} />
          <span className="text-xs text-ink-500 dark:text-ink-300">状态筛选：</span>
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
          theme={theme}
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
          onDeleteBlog={(blog) => setDeletingBlog(blog)}
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
          handleDelete={(blog) => setDeletingBlog(blog)}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deletingBlog)}
        onClose={() => setDeletingBlog(null)}
        onConfirm={() => deletingBlog && deleteMutation.mutate(deletingBlog.id)}
        title="删除文章"
        message={`确定要删除文章「${deletingBlog?.title}」吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
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
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900'
          : 'bg-paper-200/70 dark:bg-white/[0.06] text-ink-600 dark:text-ink-300 hover:border-vermilion'
      }`}
    >
      {label}
    </button>
  )
}

function ReviewMode({
  theme,
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
  theme: 'light' | 'dark'
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
    return <StateCard type="loading" title="待审核列表加载中..." />
  }

  if (pendingList.length === 0) {
    return <StateCard type="empty" title="当前没有待审核文章" description="审核队列已全部处理完毕。" />
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
      <aside className="card p-0 overflow-hidden hover:transform-none">
        <div className="border-b border-hairline-light dark:border-hairline-dark px-4 py-3 text-xs font-medium text-ink-500 dark:text-ink-300">
          待审核队列（{pendingList.length}）
        </div>
        <div className="max-h-[72vh] overflow-y-auto divide-y divide-hairline-light dark:divide-hairline-dark">
          {pendingList.map((blog) => {
            const active = blog.id === selectedBlogId
            return (
              <button
                key={blog.id}
                type="button"
                onClick={() => setSelectedBlogId(blog.id)}
                className={`w-full px-4 py-3.5 text-left transition-colors ${
                  active
                    ? 'bg-vermilion/15 border-l-2 border-l-vermilion'
                    : 'hover:bg-paper-200/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium text-ink-800 dark:text-ink-100">
                    {blog.title}
                  </p>
                  <FiChevronRight className="mt-0.5 flex-shrink-0 text-ink-400" size={16} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-ink-400">
                  <span>{blog.author?.username || '未知作者'}</span>
                  <span>{new Date(blog.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="card hover:transform-none">
        {selectedLoading ? (
          <StateCard type="loading" title="预览加载中..." className="py-10" />
        ) : selectedError || !selectedBlogData || !selectedSummary ? (
          <StateCard type="error" title="预览加载失败" description="请选择其他文章重试" className="py-10" />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline-light dark:border-hairline-dark pb-4">
              <div>
                <h2 className="font-editorial-serif text-2xl font-bold text-ink-900 dark:text-ink-50">
                  {selectedSummary.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500 dark:text-ink-300">
                  <span className={`px-2.5 py-0.5 rounded-full font-medium ${REVIEW_STATUS_META.PENDING.badgeClass}`}>
                    待审核
                  </span>
                  <span>作者：{selectedSummary.author?.username || '未知'}</span>
                  <span>提交于：{new Date(selectedSummary.createdAt).toLocaleString('zh-CN')}</span>
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
              <img
                src={selectedBlogData.image}
                alt={selectedSummary.title}
                className="h-56 w-full rounded-2xl object-cover"
              />
            )}

            <div className="text-sm text-ink-600 dark:text-ink-300">
              {selectedBlogData.summary || '暂无摘要'}
            </div>

            <div
              data-color-mode={theme}
              className="rounded-2xl border border-hairline-light dark:border-hairline-dark p-4 prose-editorial"
            >
              <div className="max-h-[360px] overflow-y-auto">
                <MDEditor.Markdown source={selectedBlogData.rawContent || selectedBlogData.content || ''} />
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-hairline-light dark:border-hairline-dark bg-paper-200/40 dark:bg-white/[0.03] p-4">
              <label className="text-xs font-medium text-ink-600 dark:text-ink-200" htmlFor="reject-reason">
                审核退回原因（拒绝时必填）
              </label>
              <textarea
                id="reject-reason"
                className="input min-h-[84px] resize-y text-sm"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例如：标题与正文不一致、需要补充说明或修改敏感表述..."
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
    <div className="card overflow-hidden p-0 hover:transform-none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-paper-200/60 dark:bg-white/[0.04] border-b border-hairline-light dark:border-hairline-dark">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-500 dark:text-ink-300">文章</th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-500 dark:text-ink-300">作者</th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-500 dark:text-ink-300">状态</th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-500 dark:text-ink-300">阅读/互动</th>
              <th className="px-6 py-3.5 text-right text-xs font-medium text-ink-500 dark:text-ink-300">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-light dark:divide-hairline-dark">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-400">加载中...</td>
              </tr>
            ) : !data?.content?.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-400">暂无文章</td>
              </tr>
            ) : (
              data.content.map((blog: BlogAdminView & { publishAt?: string; isSticky?: boolean }) => {
                const statusInfo = statusLabels[blog.status] || statusLabels.PENDING
                return (
                  <tr
                    key={blog.id}
                    className="hover:bg-paper-200/40 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-sm">
                        <div className="flex items-center gap-2">
                          {blog.isSticky && <span className="badge badge-vermilion">置顶</span>}
                          <Link
                            to={`/blog/${blog.id}`}
                            target="_blank"
                            className="line-clamp-1 font-medium text-ink-800 dark:text-ink-100 hover:text-vermilion"
                          >
                            {blog.title}
                          </Link>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-ink-400">{blog.summary}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {blog.author ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              blog.author.avatar ||
                              `https://ui-avatars.com/api/?name=${blog.author.username}&background=9E6B52&color=FAF8F4`
                            }
                            alt={blog.author.username}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                          <span className="text-xs text-ink-700 dark:text-ink-200">
                            {blog.author.username}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-400">未知</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {blog.status === 'SCHEDULED' && blog.publishAt && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400">
                          <FiClock size={10} />
                          {new Date(blog.publishAt).toLocaleString('zh-CN')}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-ink-500 dark:text-ink-300">
                        <span className="inline-flex items-center gap-1">
                          <FiEye size={13} /> {blog.views || 0}
                        </span>
                        <span>赞 {blog.likesCount || 0}</span>
                        <span>评 {blog.commentCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {blog.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => onApprove(blog.id)}
                              className="rounded-xl p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="通过审核"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => onReject(blog.id)}
                              className="rounded-xl p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="拒绝"
                            >
                              <FiX size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onToggleSticky(blog.id)}
                          className={`rounded-xl p-2 transition-colors ${
                            blog.isSticky
                              ? 'text-amber-500 bg-amber-500/10'
                              : 'text-ink-400 hover:text-amber-500 hover:bg-amber-500/10'
                          }`}
                          title="切换置顶"
                        >
                          <FiStar size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(blog)}
                          className="rounded-xl p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="删除文章"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-hairline-light dark:border-hairline-dark px-6 py-4 text-xs">
          <p className="text-ink-500 dark:text-ink-400">
            共 {data.totalElements} 条记录，第 {page + 1} / {data.totalPages} 页
          </p>
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
