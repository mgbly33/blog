import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { FiClock, FiEdit3, FiEye, FiHeart, FiMessageCircle, FiTrash2 } from 'react-icons/fi'
import { blogApi } from '@/api/blog'
import { draftApi } from '@/api/draft'
import StateCard from '@/components/ui/StateCard'
import { ConfirmModal } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { invalidateBlogCollections } from '@/utils/queryInvalidation'
import type { BlogListItem, DraftListItem } from '@/types'
import { REVIEW_STATUS_META } from '@/constants/reviewStatus'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

type ContentTab = 'drafts' | 'pending' | 'published' | 'rejected'

const TAB_CONFIG: Array<{ key: ContentTab; label: string }> = [
  { key: 'drafts', label: '草稿箱' },
  { key: 'pending', label: '审核中' },
  { key: 'published', label: '已发布' },
  { key: 'rejected', label: '未通过' },
]

function parseDraftList(data: unknown): DraftListItem[] {
  if (Array.isArray(data)) return data as DraftListItem[]
  if (data && typeof data === 'object' && 'content' in data) {
    const content = (data as { content?: unknown }).content
    if (Array.isArray(content)) return content as DraftListItem[]
  }
  return []
}

export default function MyContent() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [deleteDraftId, setDeleteDraftId] = useState<string | null>(null)
  const [deleteBlogId, setDeleteBlogId] = useState<string | null>(null)

  const tabParam = searchParams.get('tab') as ContentTab | null
  const activeTab: ContentTab = TAB_CONFIG.some((item) => item.key === tabParam)
    ? (tabParam as ContentTab)
    : 'drafts'

  const { data: blogsData, isLoading: blogsLoading, isError: blogsError } = useQuery({
    queryKey: ['my-content', 'blogs', user?.username],
    queryFn: () => blogApi.getUserBlogs(user!.username, 0, 100),
    enabled: Boolean(user?.username),
  })

  const { data: draftsData, isLoading: draftsLoading, isError: draftsError } = useQuery({
    queryKey: ['my-content', 'drafts'],
    queryFn: () => draftApi.getDrafts(0, 50),
  })

  const deleteDraftMutation = useMutation({
    mutationFn: (id: string) => draftApi.deleteDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-content', 'drafts'] })
      setDeleteDraftId(null)
      toast.success('草稿已删除')
    },
    onError: () => toast.error('草稿删除失败'),
  })

  const deleteBlogMutation = useMutation({
    mutationFn: (id: string) => blogApi.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-content', 'blogs'] })
      invalidateBlogCollections(queryClient)
      setDeleteBlogId(null)
      toast.success('文章已删除')
    },
    onError: () => toast.error('文章删除失败'),
  })

  const blogs = blogsData?.data?.content || []
  const drafts = parseDraftList(draftsData?.data)

  const pendingBlogs = useMemo(() => blogs.filter((b) => b.status === 'PENDING'), [blogs])
  const publishedBlogs = useMemo(
    () =>
      blogs.filter(
        (b) => b.status === 'APPROVED' || b.status === 'SCHEDULED' || b.status === 'ARCHIVED'
      ),
    [blogs]
  )
  const rejectedBlogs = useMemo(() => blogs.filter((b) => b.status === 'REJECTED'), [blogs])

  const tabCounts: Record<ContentTab, number> = {
    drafts: drafts.length,
    pending: pendingBlogs.length,
    published: publishedBlogs.length,
    rejected: rejectedBlogs.length,
  }

  const isLoading = activeTab === 'drafts' ? draftsLoading : blogsLoading
  const isError = activeTab === 'drafts' ? draftsError : blogsError

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="border-b border-hairline-light dark:border-hairline-dark pb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-editorial-mono uppercase tracking-[0.22em] text-vermilion font-semibold">
            CONTENT WORKSPACE
          </p>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-50 mt-1">
            我的文章与草稿
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
            管理你的云端草稿、审核状态与已发布博客文章。
          </p>
        </div>

        <Link to="/editor" className="btn btn-primary">
          <FiEdit3 size={14} />
          <span>写新文章</span>
        </Link>
      </header>

      {/* Tabs */}
      <div className="border-b border-hairline-light dark:border-hairline-dark flex items-center gap-6 sm:gap-9 overflow-x-auto no-scrollbar">
        {TAB_CONFIG.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`pb-3 border-b-2 whitespace-nowrap flex items-baseline gap-2 transition-colors ${
                active
                  ? 'border-vermilion text-ink-900 dark:text-ink-50 font-semibold'
                  : 'border-transparent text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
              }`}
            >
              <span className="text-sm">{tab.label}</span>
              <span className="font-editorial-mono text-[11px] opacity-75">
                ({tabCounts[tab.key]})
              </span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <StateCard type="loading" title="正在加载文章列表..." />
      ) : isError ? (
        <StateCard type="error" title="无法读取内容列表" description="请刷新页面后重试" />
      ) : (
        <>
          {activeTab === 'drafts' && (
            <ContentList
              emptyText="草稿箱内暂无未发布的草稿"
              data={drafts}
              renderItem={(draft) => (
                <article
                  key={draft.id}
                  className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-editorial-mono text-ink-400">
                      <span className="text-vermilion font-semibold">草稿</span>
                      <span>·</span>
                      <span>{draft.wordCount ?? 0} 字</span>
                    </div>
                    <h3 className="font-editorial-serif text-xl font-bold text-ink-900 dark:text-ink-50 truncate">
                      {draft.title || '未命名草稿'}
                    </h3>
                    {draft.summary && (
                      <p className="line-clamp-2 text-xs text-ink-500 dark:text-ink-400">
                        {draft.summary}
                      </p>
                    )}
                    <p className="text-xs text-ink-400 inline-flex items-center gap-1.5 pt-1">
                      <FiClock size={12} />
                      <span>
                        {draft.updatedAt ? `${dayjs(draft.updatedAt).fromNow()}自动保存` : '刚刚保存'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/editor?draft=${draft.id}`} className="btn btn-primary btn-sm">
                      继续编辑
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteDraftId(draft.id)}
                      className="btn btn-secondary btn-sm text-rose-600 dark:text-rose-400"
                      title="删除草稿"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </article>
              )}
            />
          )}

          {activeTab === 'pending' && (
            <ContentList
              emptyText="当前没有等待审核的文章"
              data={pendingBlogs}
              renderItem={(blog) => (
                <BlogItemCard key={blog.id} blog={blog} onDelete={() => setDeleteBlogId(blog.id)} />
              )}
            />
          )}

          {activeTab === 'published' && (
            <ContentList
              emptyText="尚未发布任何文章"
              data={publishedBlogs}
              renderItem={(blog) => (
                <BlogItemCard key={blog.id} blog={blog} onDelete={() => setDeleteBlogId(blog.id)} />
              )}
            />
          )}

          {activeTab === 'rejected' && (
            <ContentList
              emptyText="没有审核未通过的文章"
              data={rejectedBlogs}
              renderItem={(blog) => (
                <BlogItemCard key={blog.id} blog={blog} onDelete={() => setDeleteBlogId(blog.id)} />
              )}
            />
          )}
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteDraftId)}
        onClose={() => setDeleteDraftId(null)}
        onConfirm={() => deleteDraftId && deleteDraftMutation.mutate(deleteDraftId)}
        title="删除草稿"
        message="确定要永久删除这篇草稿吗？删除后无法恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteDraftMutation.isPending}
      />

      <ConfirmModal
        isOpen={Boolean(deleteBlogId)}
        onClose={() => setDeleteBlogId(null)}
        onConfirm={() => deleteBlogId && deleteBlogMutation.mutate(deleteBlogId)}
        title="删除文章"
        message="确定要永久删除这篇文章吗？删除后无法恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteBlogMutation.isPending}
      />
    </div>
  )
}

function ContentList<T>({
  data,
  emptyText,
  renderItem,
}: {
  data: T[]
  emptyText: string
  renderItem: (item: T) => ReactNode
}) {
  if (data.length === 0) {
    return (
      <StateCard
        type="empty"
        title={emptyText}
        actionText="写新文章"
        actionTo="/editor"
      />
    )
  }

  return <div className="space-y-4">{data.map((item) => renderItem(item))}</div>
}

function BlogItemCard({
  blog,
  onDelete,
}: {
  blog: BlogListItem
  onDelete: () => void
}) {
  const statusMeta = REVIEW_STATUS_META[blog.status] || {
    label: blog.status,
    badgeClass: 'bg-paper-200 text-ink-600',
  }

  return (
    <article className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusMeta.badgeClass}`}>
            {statusMeta.label}
          </span>
          <span className="text-ink-400">{dayjs(blog.createdAt).format('YYYY-MM-DD HH:mm')}</span>
        </div>

        <Link to={`/blog/${blog.id}`} className="block">
          <h3 className="font-editorial-serif text-xl font-bold text-ink-900 dark:text-ink-50 hover:text-vermilion transition-colors truncate">
            {blog.title}
          </h3>
        </Link>

        {blog.summary && (
          <p className="text-xs text-ink-500 dark:text-ink-400 line-clamp-2">{blog.summary}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-ink-400 pt-1">
          <span className="inline-flex items-center gap-1">
            <FiEye size={12} /> {blog.views || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiHeart size={12} /> {blog.likesCount || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiMessageCircle size={12} /> {blog.commentCount || 0}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link to={`/editor?id=${blog.id}`} className="btn btn-secondary btn-sm">
          编辑
        </Link>
        <Link to={`/blog/${blog.id}`} className="btn btn-primary btn-sm">
          查看
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="btn btn-secondary btn-sm text-rose-600 dark:text-rose-400"
          title="删除文章"
        >
          <FiTrash2 size={13} />
        </button>
      </div>
    </article>
  )
}
