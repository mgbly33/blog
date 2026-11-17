import { useState, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import {
  FiArrowLeft,
  FiHeart,
  FiEdit2,
  FiTrash2,
  FiBookmark,
  FiBook,
  FiChevronLeft,
  FiChevronRight,
  FiCornerDownRight,
  FiMinimize2,
  FiShare2,
  FiZap,
} from 'react-icons/fi'
import MDEditor from '@uiw/react-md-editor'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { blogApi } from '@/api/blog'
import { categoryApi, tagApi } from '@/api/category'
import { commentApi } from '@/api/comment'
import { seriesApi } from '@/api/series'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { invalidateBlogCollections, invalidateUserEngagement } from '@/utils/queryInvalidation'
import { useReadProgress } from '@/hooks/useReadProgress'
import { useTableOfContents } from '@/hooks/useTableOfContents'
import ReadingProgressBar from '@/components/ReadingProgressBar'
import EditorialCover from '@/components/editorial/EditorialCover'
import ArticleLeftRail from '@/components/editorial/ArticleLeftRail'
import ArticleRightRail from '@/components/editorial/ArticleRightRail'
import type { Comment, BlogListItem, Category, Tag } from '@/types'
import ReportModal from '@/components/ReportModal'
import StateCard from '@/components/ui/StateCard'
import { ConfirmModal } from '@/components/ui'
import { REVIEW_STATUS_META } from '@/constants/reviewStatus'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const QUICK_REACTION_CHIPS = [
  { emoji: '👏', label: '干货满满', text: '干货满满，读完受益匪浅！感谢作者的用心沉淀。' },
  { emoji: '💡', label: '很有启发', text: '切入视角非常独特，给了我很多新的架构与设计启发。' },
  { emoji: '🔥', label: '深度好文', text: '逻辑清晰、案例扎实，是一篇值得收藏反复研读的深度好文。' },
  { emoji: '✨', label: '排版极佳', text: '无论是内容深度还是视觉排版都太舒服了，阅读体验拉满！' },
]

const BLOG_STATUS_META: Record<string, { label: string; badgeClass: string; description: string }> = {
  PENDING: {
    ...REVIEW_STATUS_META.PENDING,
    description: '文章已提交，等待管理员审核通过后公开展示。',
  },
  APPROVED: {
    ...REVIEW_STATUS_META.APPROVED,
    description: '文章已通过审核，对外公开可见。',
  },
  REJECTED: {
    ...REVIEW_STATUS_META.REJECTED,
    description: '文章未通过审核，请根据审核意见修改后重新提交。',
  },
  SCHEDULED: {
    ...REVIEW_STATUS_META.SCHEDULED,
    description: '文章已设置定时发布时间。',
  },
  ARCHIVED: {
    ...REVIEW_STATUS_META.ARCHIVED,
    description: '文章已归档，默认不再对外公开展示。',
  },
}

function decodeHtmlEntities(input?: string | null): string {
  if (!input || !input.includes('&')) return input || ''
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const cp = parseInt(hex, 16)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const cp = parseInt(dec, 10)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _
    })
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const { theme, readerFontSize, readerFontFamily } = useUIStore()

  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyToUsername, setReplyToUsername] = useState<string | null>(null)
  const [zenMode, setZenMode] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const commentsSectionRef = useRef<HTMLElement>(null)

  const { data: blogData, isLoading, isError, error } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => blogApi.getBlog(id!),
    enabled: !!id,
  })

  const { toc, activeId, readingProgress, scrollToHeading } = useTableOfContents(
    contentRef,
    blogData?.data?.id
  )
  useReadProgress({ blogId: id, enabled: !!id && Boolean(blogData?.data) })

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentApi.getComments(id!),
    enabled: !!id,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagApi.getAll(),
  })

  const seriesId = blogData?.data?.seriesId
  const { data: seriesData } = useQuery({
    queryKey: ['series', seriesId],
    queryFn: () => seriesApi.getSeriesById(String(seriesId)),
    enabled: !!seriesId,
  })

  const allTags: Tag[] = tagsData?.data || []

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>()
    for (const c of categoriesData?.data || []) {
      map.set(String(c.id), c)
    }
    return map
  }, [categoriesData])

  const tagMap = useMemo(() => {
    const map = new Map<string, Tag>()
    for (const t of allTags) {
      map.set(String(t.id), t)
    }
    return map
  }, [allTags])

  const likeMutation = useMutation({
    mutationFn: () => blogApi.likeBlog(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', id] })
      invalidateUserEngagement(queryClient, user?.username)
      invalidateBlogCollections(queryClient)
      toast.success('已更新喜欢状态')
    },
  })

  const bookmarkMutation = useMutation({
    mutationFn: () => blogApi.bookmarkBlog(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', id] })
      invalidateUserEngagement(queryClient, user?.username)
      toast.success('已同步至收藏夹')
    },
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      commentApi.createComment({
        blogId: id!,
        content,
        parentCommentId: replyTo || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] })
      if (replyTo) {
        queryClient.invalidateQueries({ queryKey: ['replies', replyTo] })
      }
      queryClient.invalidateQueries({ queryKey: ['blog', id] })
      invalidateBlogCollections(queryClient)
      setCommentContent('')
      setReplyTo(null)
      setReplyToUsername(null)
      toast.success('评论已发布')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || '评论提交失败，请重试'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => blogApi.deleteBlog(id!),
    onSuccess: () => {
      invalidateBlogCollections(queryClient)
      invalidateUserEngagement(queryClient, user?.username)
      toast.success('文章已删除')
      navigate('/')
    },
    onError: () => toast.error('删除失败'),
  })

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      toast.error('请先登录后再点赞')
      navigate('/login')
      return
    }
    likeMutation.mutate()
  }

  const handleToggleBookmark = () => {
    if (!isAuthenticated) {
      toast.error('请先登录后再收藏')
      navigate('/login')
      return
    }
    bookmarkMutation.mutate()
  }

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) {
      toast.error('请输入评论内容')
      return
    }
    if (!isAuthenticated) {
      toast.error('请先登录后参与互动')
      navigate('/login')
      return
    }
    commentMutation.mutate(commentContent)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('文章链接已复制')
  }

  const handleReply = (commentId: string, username: string) => {
    setReplyTo(commentId)
    setReplyToUsername(username)
    commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-14">
        <StateCard type="loading" title="正在加载文章..." description="为你准备舒适的阅读版面" />
      </div>
    )
  }

  if (isError) {
    const axiosError = error as AxiosError<{ message?: string }>
    const apiMessage = axiosError.response?.data?.message
    return (
      <div className="max-w-3xl mx-auto py-14">
        <StateCard
          type="error"
          title="文章暂时无法访问"
          description={apiMessage || '该文章可能正在审核或已被设为私密。'}
          actionText="返回首页"
          actionTo="/"
        />
      </div>
    )
  }

  const blog = blogData?.data
  const comments = commentsData?.data?.content || []
  const isAuthor = Boolean(user?.id && blog?.author?.id && String(user.id) === String(blog.author.id))
  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')
  const showNonPublicBanner = Boolean(
    blog && (isAuthor || isAdminUser) && blog.status !== 'APPROVED'
  )
  const statusMeta = blog ? BLOG_STATUS_META[blog.status] : null

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto py-14">
        <StateCard type="empty" title="文章不存在" actionText="返回首页" actionTo="/" />
      </div>
    )
  }

  const categoryName = blog.categoryId
    ? categoryMap.get(String(blog.categoryId))?.name || '技术专栏'
    : '随笔文章'
  const totalCommentCount = blog.commentCount ?? comments.length

  return (
    <>
      <ReadingProgressBar progress={readingProgress} />

      {/* Exit Zen Mode Floating Pill */}
      {zenMode && (
        <div className="fixed left-6 top-24 z-40 hidden lg:block">
          <button
            type="button"
            onClick={() => setZenMode(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF8F4]/90 dark:bg-[#191817]/90 backdrop-blur-xl border border-hairline-light dark:border-hairline-dark shadow-editorial text-xs font-medium text-ink-700 dark:text-ink-100 hover:border-vermilion hover:text-vermilion transition-all"
          >
            <FiMinimize2 size={13} />
            <span>退出专注模式</span>
          </button>
        </div>
      )}

      {/* Balanced 3-Column Wide Editorial Grid */}
      <div className="flex items-start justify-center gap-7 pt-2">
        {/* LEFT RAIL: Author Profile + AI Voice Narration + Reading Studio */}
        {!zenMode && (
          <ArticleLeftRail
            blog={blog}
            readingProgress={readingProgress}
            totalCommentCount={totalCommentCount}
            onToggleLike={handleToggleLike}
            onToggleBookmark={handleToggleBookmark}
            onScrollToComments={() =>
              commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
            onShare={handleShare}
            onReport={() => setShowReportModal(true)}
            onEnterZen={() => setZenMode(true)}
            likePending={likeMutation.isPending}
            bookmarkPending={bookmarkMutation.isPending}
          />
        )}

        {/* CENTER COLUMN: Main Reading Sheet & Discussions */}
        <div className={`flex-1 min-w-0 pb-16 ${zenMode ? 'max-w-[860px]' : 'max-w-[840px]'}`}>
          <article className="card p-6 sm:p-10 md:p-12 space-y-8 hover:transform-none">
            <header className="space-y-5 pb-7 border-b border-hairline-light dark:border-hairline-dark">
              {showNonPublicBanner && statusMeta && (
                <div className="p-3.5 rounded-2xl bg-vermilion/10 border border-vermilion/20 text-xs text-ink-700 dark:text-ink-200">
                  <strong className="text-vermilion">当前状态：{statusMeta.label}</strong> —{' '}
                  {statusMeta.description}
                </div>
              )}

              {/* Dedicated Top Back Navigation & Issue Serial Row */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-hairline-light dark:border-hairline-dark text-xs">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-200/85 dark:bg-white/[0.06] border border-hairline-light dark:border-hairline-dark text-ink-700 dark:text-ink-100 hover:border-vermilion hover:text-vermilion font-medium transition-all"
                  >
                    <FiArrowLeft size={13} />
                    <span>返回上一页</span>
                  </button>
                  <span className="hidden sm:inline text-ink-300 dark:text-ink-600">/</span>
                  <Link
                    to="/"
                    className="hidden sm:inline text-ink-400 hover:text-vermilion transition-colors"
                  >
                    精选首页
                  </Link>
                  <span className="hidden sm:inline text-ink-300 dark:text-ink-600">/</span>
                  <span className="hidden sm:inline text-ink-600 dark:text-ink-300 font-medium">
                    {categoryName}
                  </span>
                </div>

                <span className="font-editorial-mono text-[11px] uppercase tracking-[0.18em] text-ink-400 shrink-0">
                  ISSUE NO. {String(blog.id).padStart(3, '0')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-ink-400">
                {blog.categoryId ? (
                  <Link
                    to={`/category/${blog.categoryId}`}
                    className="badge badge-vermilion hover:opacity-85"
                  >
                    {categoryName}
                  </Link>
                ) : (
                  <span className="badge badge-vermilion">{categoryName}</span>
                )}
                <span>{dayjs(blog.createdAt).format('YYYY年MM月DD日')}</span>
                <span>·</span>
                <span>约 {blog.readTime || 4} 分钟阅读</span>
                <span>·</span>
                <span>{blog.views || 0} 次阅读</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-[2.65rem] font-semibold font-editorial-serif tracking-tight text-ink-800 dark:text-ink-50 leading-[1.2]">
                {blog.title}
              </h1>

              {/* Executive Summary / Editorial Lead Box */}
              {blog.summary && blog.summary.trim() !== blog.title.trim() && (
                <div className="p-4 sm:p-5 rounded-2xl bg-paper-200/55 dark:bg-white/[0.04] border border-hairline-light dark:border-hairline-dark space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-vermilion uppercase tracking-wider">
                    <FiZap size={12} />
                    <span>核心导读 · Executive Summary</span>
                  </div>
                  <p className="font-reading-serif text-sm sm:text-base text-ink-600 dark:text-ink-200 leading-relaxed">
                    {blog.summary}
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <Link
                  to={`/user/${blog.author?.username}`}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={
                      blog.author?.avatar ||
                      `https://ui-avatars.com/api/?name=${blog.author?.username}&background=9E6B52&color=FAF8F4`
                    }
                    alt={blog.author?.username}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-white/10"
                  />
                  <div>
                    <span className="text-sm font-semibold text-ink-800 dark:text-ink-50 group-hover:text-vermilion transition-colors">
                      {blog.author?.username}
                    </span>
                    <p className="text-xs text-ink-400">
                      发布于 {dayjs(blog.createdAt).fromNow()}
                    </p>
                  </div>
                </Link>

                {(isAuthor || isAdminUser) && (
                  <div className="flex items-center gap-2">
                    {isAuthor && (
                      <Link to={`/editor?id=${blog.id}`} className="btn btn-secondary btn-sm">
                        <FiEdit2 size={13} />
                        <span>编辑</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn btn-danger btn-sm"
                      disabled={deleteMutation.isPending}
                    >
                      <FiTrash2 size={13} />
                      <span>删除</span>
                    </button>
                  </div>
                )}
              </div>
            </header>

            <EditorialCover
              src={blog.image}
              title={blog.title}
              seed={blog.id}
              badgeText={blog.image ? undefined : categoryName}
              aspectClass="aspect-[16/9]"
            />

            {/* Smooth Prose Body */}
            <div
              ref={contentRef}
              data-color-mode={theme}
              className={`prose-editorial editorial-dropcap prose-family-${readerFontFamily} prose-size-${readerFontSize}`}
            >
              <MDEditor.Markdown source={blog.rawContent || blog.content} />
            </div>

            {blog.tags && blog.tags.length > 0 && (
              <div className="pt-6 border-t border-hairline-light dark:border-hairline-dark flex flex-wrap items-center gap-2">
                <span className="text-xs text-ink-400 mr-1">本文标签：</span>
                {blog.tags.map((tagId) => {
                  const tagName = tagMap.get(String(tagId))?.name || String(tagId)
                  return (
                    <Link
                      key={tagId}
                      to={`/tag/${tagId}`}
                      className="badge hover:border-vermilion/40 hover:text-vermilion transition-colors"
                    >
                      #{tagName}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* End-of-Article Appreciation & Share Callout Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-paper-200/75 via-paper-100/60 to-vermilion/5 dark:from-white/[0.04] dark:via-white/[0.02] dark:to-vermilion/10 border border-hairline-light dark:border-hairline-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-editorial-serif text-lg font-bold text-ink-800 dark:text-ink-50">
                  感谢耐心读完这篇创作
                </p>
                <p className="text-xs text-ink-500 dark:text-ink-300">
                  如果文中的思考或实践对你有启发，不妨点个喜欢或加入收藏夹，你的支持是持续创作的最大动力。
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={likeMutation.isPending}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    blog.isLiked
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 hover:bg-vermilion'
                  }`}
                >
                  <FiHeart size={13} className={blog.isLiked ? 'fill-current' : ''} />
                  <span>{blog.isLiked ? '已喜欢' : '点赞支持'} ({blog.likesCount || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  disabled={bookmarkMutation.isPending}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                    blog.isBookmarked
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-paper-50 dark:bg-white/[0.05] text-ink-700 dark:text-ink-200 border-hairline-light dark:border-hairline-dark hover:border-vermilion'
                  }`}
                >
                  <FiBookmark size={13} className={blog.isBookmarked ? 'fill-current' : ''} />
                  <span>收藏 ({blog.collectCount || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-full bg-paper-50 dark:bg-white/[0.05] border border-hairline-light dark:border-hairline-dark text-ink-600 dark:text-ink-200 hover:text-vermilion transition-colors"
                  title="复制文章链接"
                >
                  <FiShare2 size={14} />
                </button>
              </div>
            </div>
          </article>

          {/* Series Chapter Navigator */}
          {seriesData?.data &&
            (() => {
              const series = seriesData.data
              const posts = series.posts || []
              const currentIndex = posts.findIndex((p: BlogListItem) => String(p.id) === id)
              const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null
              const nextPost =
                currentIndex >= 0 && currentIndex < posts.length - 1
                  ? posts[currentIndex + 1]
                  : null

              return (
                <div className="card mt-6 space-y-4 hover:transform-none">
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      to={`/series/${series.id}`}
                      className="flex items-center gap-2 font-semibold text-ink-800 dark:text-ink-100 hover:text-vermilion"
                    >
                      <FiBook size={15} className="text-vermilion" />
                      <span>所属专栏：{series.title}</span>
                    </Link>
                    {posts.length > 0 && currentIndex >= 0 && (
                      <span className="badge">
                        第 {currentIndex + 1} / {posts.length} 篇
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {prevPost ? (
                      <Link
                        to={`/blog/${prevPost.id}`}
                        className="p-3.5 rounded-2xl bg-paper-100/80 dark:bg-white/[0.04] hover:bg-vermilion/10 transition-colors"
                      >
                        <span className="flex items-center gap-1 text-ink-400 mb-1">
                          <FiChevronLeft size={13} /> 上一篇
                        </span>
                        <p className="font-medium text-ink-800 dark:text-ink-100 truncate">
                          {prevPost.title}
                        </p>
                      </Link>
                    ) : (
                      <div />
                    )}

                    {nextPost ? (
                      <Link
                        to={`/blog/${nextPost.id}`}
                        className="p-3.5 rounded-2xl bg-paper-100/80 dark:bg-white/[0.04] hover:bg-vermilion/10 transition-colors text-right"
                      >
                        <span className="flex items-center justify-end gap-1 text-ink-400 mb-1">
                          下一篇 <FiChevronRight size={13} />
                        </span>
                        <p className="font-medium text-ink-800 dark:text-ink-100 truncate">
                          {nextPost.title}
                        </p>
                      </Link>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              )
            })()}

          {/* Discussions Card */}
          <section ref={commentsSectionRef} className="card mt-6 space-y-6 hover:transform-none">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-editorial-serif text-2xl font-semibold text-ink-800 dark:text-ink-50">
                互动评论 ({totalCommentCount})
              </h3>
              <span className="text-xs text-ink-400">理性交流 · 碰撞思想火花</span>
            </div>

            {/* Quick Reaction Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-400">快捷共鸣：</span>
              {QUICK_REACTION_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() =>
                    setCommentContent((prev) => (prev ? `${prev} ${chip.text}` : chip.text))
                  }
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-paper-200/70 dark:bg-white/[0.05] border border-hairline-light dark:border-hairline-dark text-ink-600 dark:text-ink-300 hover:border-vermilion hover:text-vermilion transition-colors"
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitComment} className="space-y-3">
              {replyTo && (
                <div className="flex items-center justify-between text-xs text-vermilion bg-vermilion/10 px-4 py-2 rounded-full">
                  <span className="flex items-center gap-1.5">
                    <FiCornerDownRight size={13} />
                    回复 <strong>@{replyToUsername}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTo(null)
                      setReplyToUsername(null)
                    }}
                    className="hover:underline"
                  >
                    取消
                  </button>
                </div>
              )}

              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={
                  isAuthenticated ? '写下温和而有见地的想法...' : '登录后参与评论交流...'
                }
                className="input min-h-[110px] resize-y text-sm"
                disabled={!isAuthenticated}
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={commentMutation.isPending || !isAuthenticated}
                  className="btn btn-primary btn-sm"
                >
                  {commentMutation.isPending ? '发送中...' : '发表评论'}
                </button>
              </div>
            </form>

            <div className="space-y-4 pt-2">
              {comments.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-400 italic">
                  还没有评论，点击上方快捷共鸣或写下第一条回应吧
                </p>
              ) : (
                comments.map((comment: Comment) => (
                  <CommentItem
                    key={comment.id}
                    blogId={id!}
                    comment={comment}
                    onReply={handleReply}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* RIGHT RAIL: Outline + Reading Overview + Recommended Posts + Hot Tags */}
        {!zenMode && (
          <ArticleRightRail
            blog={blog}
            categoryName={categoryName}
            toc={toc}
            activeId={activeId}
            readingProgress={readingProgress}
            onClickHeading={scrollToHeading}
            tags={allTags}
          />
        )}
      </div>

      {showReportModal && id && (
        <ReportModal
          targetType="BLOG"
          targetId={id}
          onClose={() => setShowReportModal(false)}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="删除文章"
        message="确定要删除这篇文章吗？删除后将无法恢复。"
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}

function CommentItem({
  blogId,
  comment,
  onReply,
}: {
  blogId: string
  comment: Comment
  onReply: (id: string, username: string) => void
}) {
  const [showReplies, setShowReplies] = useState(false)
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()

  const canDelete = Boolean(
    isAuthenticated && (user?.id === comment.author?.id || user?.isAdmin || user?.role === 'ADMIN')
  )

  const likeCommentMutation = useMutation({
    mutationFn: () => commentApi.likeComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', blogId] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: () => commentApi.deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', blogId] })
      queryClient.invalidateQueries({ queryKey: ['blog', blogId] })
      toast.success('评论已删除')
    },
    onError: () => toast.error('删除评论失败'),
  })

  return (
    <div className="p-4 rounded-2xl bg-paper-100/75 dark:bg-white/[0.04] space-y-3">
      <div className="flex gap-3.5">
        <img
          src={
            comment.author?.avatar ||
            `https://ui-avatars.com/api/?name=${comment.author?.username}&background=9E6B52&color=FAF8F4`
          }
          alt={comment.author?.username}
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <Link
              to={`/user/${comment.author?.username}`}
              className="font-semibold text-ink-800 dark:text-ink-100 hover:text-vermilion"
            >
              {comment.author?.username}
            </Link>
            <span className="text-ink-400">{dayjs(comment.createdAt).fromNow()}</span>
          </div>

          <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed whitespace-pre-wrap">
            {decodeHtmlEntities(comment.content)}
          </p>

          <div className="flex items-center gap-4 pt-1 text-xs">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => likeCommentMutation.mutate()}
                className={`inline-flex items-center gap-1 transition-colors ${
                  comment.isLiked ? 'text-rose-500 font-medium' : 'text-ink-400 hover:text-rose-500'
                }`}
              >
                <FiHeart size={12} className={comment.isLiked ? 'fill-current' : ''} />
                <span>{comment.likesCount || 0}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onReply(comment.id, comment.author.username)}
              className="text-ink-400 hover:text-vermilion transition-colors"
            >
              回复
            </button>
            {comment.replyCount > 0 && (
              <button
                type="button"
                onClick={() => setShowReplies(!showReplies)}
                className="text-vermilion/80 hover:text-vermilion transition-colors"
              >
                {showReplies ? '收起回复' : `展开 ${comment.replyCount} 条回复`}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => deleteCommentMutation.mutate()}
                disabled={deleteCommentMutation.isPending}
                className="text-ink-400 hover:text-rose-500 transition-colors ml-auto"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-11 pl-4 border-l-2 border-vermilion/25 overflow-hidden"
          >
            <ReplyList commentId={comment.id} onReply={onReply} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ReplyList({
  commentId,
  onReply,
}: {
  commentId: string
  onReply: (id: string, username: string) => void
}) {
  const { data: repliesData, isLoading } = useQuery({
    queryKey: ['replies', commentId],
    queryFn: () => commentApi.getReplies(commentId),
  })

  if (isLoading) {
    return <div className="text-xs text-ink-400 py-2">加载中...</div>
  }

  const replies = repliesData?.data || []

  return (
    <div className="space-y-3 pt-2">
      {replies.map((reply: Comment) => (
        <div key={reply.id} className="flex gap-3">
          <img
            src={
              reply.author?.avatar ||
              `https://ui-avatars.com/api/?name=${reply.author?.username}&background=9E6B52&color=FAF8F4`
            }
            alt={reply.author?.username}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2 text-xs">
              <Link
                to={`/user/${reply.author?.username}`}
                className="font-semibold text-ink-800 dark:text-ink-100 hover:text-vermilion"
              >
                {reply.author?.username}
              </Link>
              <span className="text-ink-400">{dayjs(reply.createdAt).fromNow()}</span>
            </div>
            <p className="text-xs text-ink-700 dark:text-ink-200 leading-relaxed whitespace-pre-wrap">
              {decodeHtmlEntities(reply.content)}
            </p>
            <button
              type="button"
              onClick={() => onReply(commentId, reply.author.username)}
              className="text-[11px] text-ink-400 hover:text-vermilion"
            >
              回复
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
