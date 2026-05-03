import { useMemo, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { FiClock, FiEdit2, FiFileText } from 'react-icons/fi'
import { blogApi } from '@/api/blog'
import { draftApi } from '@/api/draft'
import StateCard from '@/components/ui/StateCard'
import { useAuthStore } from '@/stores/authStore'
import type { BlogListItem, DraftListItem } from '@/types'
import { REVIEW_STATUS_META } from '@/constants/reviewStatus'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

type ContentTab = 'drafts' | 'pending' | 'published' | 'rejected'

const TAB_CONFIG: Array<{ key: ContentTab; label: string }> = [
  { key: 'drafts', label: '草稿' },
  { key: 'pending', label: '待审核' },
  { key: 'published', label: '已发布' },
  { key: 'rejected', label: '未通过' },
]

function parseDraftList(data: unknown): DraftListItem[] {
  if (Array.isArray(data)) {
    return data as DraftListItem[]
  }

  if (data && typeof data === 'object' && 'content' in data) {
    const content = (data as { content?: unknown }).content
    if (Array.isArray(content)) {
      return content as DraftListItem[]
    }
  }

  return []
}

export default function MyContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const tabParam = searchParams.get('tab') as ContentTab | null
  const activeTab: ContentTab = TAB_CONFIG.some((item) => item.key === tabParam) ? (tabParam as ContentTab) : 'drafts'

  const { data: blogsData, isLoading: blogsLoading, isError: blogsError } = useQuery({
    queryKey: ['my-content', 'blogs', user?.username],
    queryFn: () => blogApi.getUserBlogs(user!.username, 0, 100),
    enabled: Boolean(user?.username),
  })

  const { data: draftsData, isLoading: draftsLoading, isError: draftsError } = useQuery({
    queryKey: ['my-content', 'drafts'],
    queryFn: () => draftApi.getDrafts(),
  })

  const blogs = blogsData?.data?.content || []
  const drafts = parseDraftList(draftsData?.data)

  const pendingBlogs = useMemo(
    () => blogs.filter((blog) => blog.status === 'PENDING'),
    [blogs],
  )
  const publishedBlogs = useMemo(
    () => blogs.filter((blog) => blog.status === 'APPROVED' || blog.status === 'SCHEDULED'),
    [blogs],
  )
  const rejectedBlogs = useMemo(
    () => blogs.filter((blog) => blog.status === 'REJECTED'),
    [blogs],
  )

  const tabCounts: Record<ContentTab, number> = {
    drafts: drafts.length,
    pending: pendingBlogs.length,
    published: publishedBlogs.length,
    rejected: rejectedBlogs.length,
  }

  const handleTabChange = (tab: ContentTab) => {
    setSearchParams({ tab })
  }

  const isLoading = activeTab === 'drafts' ? draftsLoading : blogsLoading
  const isError = activeTab === 'drafts' ? draftsError : blogsError

  return (
    <div className="max-w-6xl mx-auto page-shell">
      <section className="panel-surface">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="section-title">我的内容中心</h1>
            <p className="section-subtitle">集中查看草稿、审核状态和已发布文章。</p>
          </div>
          <Link to="/editor" className="btn btn-primary">
            <FiEdit2 size={16} />
            写新文章
          </Link>
        </div>
      </section>

      <section className="panel-surface">
        <div className="flex flex-wrap gap-2">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}（{tabCounts[tab.key]}）
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <StateCard type="loading" title="内容加载中" description="正在整理你的内容列表..." />
      ) : isError ? (
        <StateCard type="error" title="加载失败" description="请刷新后重试" />
      ) : (
        <>
          {activeTab === 'drafts' && (
            <ContentList
              emptyText="暂无草稿"
              data={drafts}
              renderItem={(draft) => (
                <article key={draft.id} className="panel-surface hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold text-gray-800">{draft.title || '无标题草稿'}</h3>
                      {draft.summary && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{draft.summary}</p>}
                      <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <FiClock size={14} />
                          {draft.updatedAt ? `${dayjs(draft.updatedAt).fromNow()}更新` : '刚刚更新'}
                        </span>
                        <span>{draft.wordCount ?? 0} 字</span>
                      </div>
                    </div>
                    <Link to={`/editor?draft=${draft.id}`} className="btn btn-secondary btn-sm">
                      继续编辑
                    </Link>
                  </div>
                </article>
              )}
            />
          )}

          {activeTab === 'pending' && (
            <ContentList
              emptyText="当前没有待审核文章"
              data={pendingBlogs}
              renderItem={(blog) => <BlogItemCard key={blog.id} blog={blog} />}
            />
          )}

          {activeTab === 'published' && (
            <ContentList
              emptyText="还没有已发布文章"
              data={publishedBlogs}
              renderItem={(blog) => <BlogItemCard key={blog.id} blog={blog} />}
            />
          )}

          {activeTab === 'rejected' && (
            <ContentList
              emptyText="当前没有未通过文章"
              data={rejectedBlogs}
              renderItem={(blog) => <BlogItemCard key={blog.id} blog={blog} />}
            />
          )}
        </>
      )}
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
    return <StateCard type="empty" title={emptyText} />
  }

  return <section className="space-y-4">{data.map((item) => renderItem(item))}</section>
}

function BlogItemCard({ blog }: { blog: BlogListItem }) {
  const statusMeta = REVIEW_STATUS_META[blog.status as keyof typeof REVIEW_STATUS_META] || REVIEW_STATUS_META.PENDING

  return (
    <article className="panel-surface hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/blog/${blog.id}`} className="truncate text-lg font-bold text-gray-800 hover:text-primary-600">
              {blog.title}
            </Link>
            <span className={`status-chip ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{blog.summary || '暂无摘要'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              <FiFileText size={14} />
              阅读 {blog.readTime} 分钟
            </span>
            <span>浏览 {blog.views}</span>
            <span>点赞 {blog.likesCount}</span>
            <span>评论 {blog.commentCount}</span>
            <span>{dayjs(blog.createdAt).format('YYYY-MM-DD HH:mm')}</span>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Link to={`/editor?id=${blog.id}`} className="btn btn-secondary btn-sm">
            编辑
          </Link>
          <Link to={`/blog/${blog.id}`} className="btn btn-primary btn-sm">
            查看
          </Link>
        </div>
      </div>
    </article>
  )
}
