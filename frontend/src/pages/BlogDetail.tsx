import { useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import {
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiClock,
  FiEdit2,
  FiTrash2,
  FiShare2,
  FiBookmark,
  FiBook,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
} from 'react-icons/fi'
import MDEditor from '@uiw/react-md-editor'
import dayjs from 'dayjs'
import { blogApi } from '@/api/blog'
import { commentApi } from '@/api/comment'
import { seriesApi } from '@/api/series'
import { useAuthStore } from '@/stores/authStore'
import { invalidateBlogCollections, invalidateUserEngagement } from '@/utils/queryInvalidation'
import { useReadProgress } from '@/hooks/useReadProgress'
import { useTableOfContents } from '@/hooks/useTableOfContents'
import ReadingProgressBar from '@/components/ReadingProgressBar'
import TableOfContents from '@/components/TableOfContents'
import type { Comment, BlogListItem } from '@/types'
import ReportModal from '@/components/ReportModal'
import StateCard from '@/components/ui/StateCard'
import { REVIEW_STATUS_META } from '@/constants/reviewStatus'

const BLOG_STATUS_META: Record<string, { label: string; badgeClass: string; description: string }> = {
  PENDING: {
    ...REVIEW_STATUS_META.PENDING,
    description: '文章已提交，等待管理员审核。',
  },
  APPROVED: {
    ...REVIEW_STATUS_META.APPROVED,
    description: '文章已通过审核，对外可见。',
  },
  REJECTED: {
    ...REVIEW_STATUS_META.REJECTED,
    description: '文章未通过审核，请根据审核意见修改后重试。',
  },
  SCHEDULED: {
    ...REVIEW_STATUS_META.SCHEDULED,
    description: '文章已设置定时发布时间。',
  },
  ARCHIVED: {
    ...REVIEW_STATUS_META.ARCHIVED,
    description: '文章已归档，默认不再对外展示。',
  },
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyToUsername, setReplyToUsername] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [showReportModal, setShowReportModal] = useState(false)

  const { toc, activeId, readingProgress, scrollToHeading } = useTableOfContents(contentRef)
  useReadProgress({ blogId: id, enabled: !!id })

  const { data: blogData, isLoading, isError, error } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => blogApi.getBlog(id!),
    enabled: !!id,
  })

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentApi.getComments(id!),
    enabled: !!id,
  })

  const seriesId = blogData?.data?.seriesId
  const { data: seriesData } = useQuery({
    queryKey: ['series', seriesId],
    queryFn: () => seriesApi.getSeriesById(String(seriesId)),
    enabled: !!seriesId,
  })

  const likeMutation = useMutation({
    mutationFn: () => blogApi.likeBlog(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', id] })
      invalidateUserEngagement(queryClient, user?.username)
      invalidateBlogCollections(queryClient)
      toast.success('点赞成功')
    },
  })

  const bookmarkMutation = useMutation({
    mutationFn: () => blogApi.bookmarkBlog(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', id] })
      invalidateUserEngagement(queryClient, user?.username)
      toast.success('收藏状态已更新')
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
      toast.success('评论成功')
    },
    onError: () => {
      toast.error('评论失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => blogApi.deleteBlog(id!),
    onSuccess: () => {
      invalidateBlogCollections(queryClient)
      invalidateUserEngagement(queryClient, user?.username)
      toast.success('文章已删除')
      navigate('/')
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) {
      toast.error('请输入评论内容')
      return
    }
    if (!isAuthenticated) {
      toast.error('请先登录')
      navigate('/login')
      return
    }
    commentMutation.mutate(commentContent)
  }

  const handleDelete = () => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      deleteMutation.mutate()
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('链接已复制')
  }

  const handleReply = (commentId: string, username: string) => {
    setReplyTo(commentId)
    setReplyToUsername(username)
    const form = document.querySelector('form')
    form?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCancelReply = () => {
    setReplyTo(null)
    setReplyToUsername(null)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <StateCard type="loading" title="加载中..." description="正在获取文章内容..." />
      </div>
    )
  }

  if (isError) {
    const axiosError = error as AxiosError<{ message?: string }>
    const apiMessage = axiosError.response?.data?.message
    return (
      <div className="max-w-4xl mx-auto">
        <StateCard
          type="error"
          title="文章加载失败"
          description={apiMessage || '页面可能不存在或已被删除，请返回首页后重试。'}
          actionText="返回首页"
          actionTo="/"
        />
      </div>
    )
  }

  const blog = blogData?.data
  const comments = commentsData?.data?.content || []
  const isAuthor = user?.id === blog?.author?.id
  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')
  const canViewStatusHint = Boolean(blog && (isAuthor || isAdminUser))
  const statusMeta = blog ? BLOG_STATUS_META[blog.status] : null

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto">
        <StateCard type="empty" title="文章不存在或已被删除" actionText="返回首页" actionTo="/" />
      </div>
    )
  }

  return (
    <>
      <ReadingProgressBar progress={readingProgress} />
      <div className="max-w-6xl mx-auto flex gap-6">
        <div className="flex-1 max-w-4xl">
          <article className="card mb-6">
            <header className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{blog.title}</h1>
              {canViewStatusHint && statusMeta && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta.badgeClass}`}>
                      当前状态：{statusMeta.label}
                    </span>
                    <span className="text-sm text-gray-600">{statusMeta.description}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Link
                    to={`/user/${blog.author?.username}`}
                    className="flex items-center gap-2"
                  >
                    <img
                      src={blog.author?.avatar || `https://ui-avatars.com/api/?name=${blog.author?.username}`}
                      alt={blog.author?.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="text-gray-700 font-medium">{blog.author?.username}</span>
                  </Link>
                  <span className="text-gray-500 text-sm">{dayjs(blog.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                </div>

                {isAuthor && (
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/editor?id=${blog.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <FiEdit2 size={14} />
                      <span>编辑</span>
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="btn btn-danger btn-sm"
                      disabled={deleteMutation.isPending}
                    >
                      <FiTrash2 size={14} />
                      <span>删除</span>
                    </button>
                  </div>
                )}
              </div>
            </header>

            {blog.image && (
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            <div className="prose prose-lg max-w-none" data-color-mode="light" ref={contentRef}>
              <MDEditor.Markdown source={blog.content} />
            </div>

            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
                {blog.tags.map((tagId) => (
                  <Link
                    key={tagId}
                    to={`/tag/${tagId}`}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-primary-100 hover:text-primary-600"
                  >
                    #{tagId}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="flex items-center gap-6 text-gray-500">
                <span className="flex items-center gap-1">
                  <FiEye size={18} />
                  {blog.views}
                </span>
                <button
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  className="flex items-center gap-1 hover:text-red-500 transition-colors"
                >
                  <FiHeart size={18} />
                  {blog.likesCount}
                </button>
                <button
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={bookmarkMutation.isPending}
                  className={`flex items-center gap-1 hover:text-yellow-500 transition-colors ${
                    blog.isBookmarked ? 'text-yellow-500' : ''
                  }`}
                >
                  <FiBookmark size={18} className={blog.isBookmarked ? 'fill-current' : ''} />
                  {blog.collectCount}
                </button>
                <span className="flex items-center gap-1">
                  <FiMessageCircle size={18} />
                  {comments.length}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock size={18} />
                  {blog.readTime} 分钟
                </span>
              </div>
              <div className="flex items-center gap-3">
                {!isAuthor && isAuthenticated && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <FiAlertTriangle size={18} />
                    举报
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <FiShare2 size={18} />
                  分享
                </button>
              </div>
            </div>
          </article>

          {seriesData?.data && (() => {
            const series = seriesData.data
            const posts = series.posts || []
            const currentIndex = posts.findIndex((p: BlogListItem) => String(p.id) === id)
            const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null
            const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null

            return (
              <div className="card mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FiBook size={16} className="text-primary-500" />
                  <Link to={`/series/${series.id}`} className="font-bold text-gray-800 hover:text-primary-600">
                    {series.title}
                  </Link>
                  <span className="text-sm text-gray-400">
                    ({currentIndex + 1}/{posts.length})
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  {prevPost ? (
                    <Link
                      to={`/blog/${prevPost.id}`}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors min-w-0"
                    >
                      <FiChevronLeft size={16} className="flex-shrink-0" />
                      <span className="truncate">上一篇：{prevPost.title}</span>
                    </Link>
                  ) : (
                    <span />
                  )}
                  {nextPost ? (
                    <Link
                      to={`/blog/${nextPost.id}`}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors min-w-0 text-right"
                    >
                      <span className="truncate">下一篇：{nextPost.title}</span>
                      <FiChevronRight size={16} className="flex-shrink-0" />
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            )
          })()}

          <section className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-6">评论 ({comments.length})</h2>

            <form onSubmit={handleSubmitComment} className="mb-6">
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <span>回复 @{replyToUsername}</span>
                  <button
                    type="button"
                    onClick={handleCancelReply}
                    className="text-primary-600 hover:underline"
                  >
                    取消
                  </button>
                </div>
              )}
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={isAuthenticated ? '写下你的评论...' : '请先登录后评论'}
                className="input min-h-[100px] resize-none"
                disabled={!isAuthenticated}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={commentMutation.isPending || !isAuthenticated}
                  className="btn btn-primary"
                >
                  {commentMutation.isPending ? '提交中...' : '发表评论'}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <StateCard type="empty" title="还没有评论，来抢个沙发吧" className="py-8" />
              ) : (
                comments.map((comment: Comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {toc.length > 0 && (
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <TableOfContents
              toc={toc}
              activeId={activeId}
              onClickHeading={scrollToHeading}
            />
          </aside>
        )}
      </div>

      {showReportModal && id && (
        <ReportModal
          targetType="BLOG"
          targetId={id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  )
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: Comment
  onReply: (id: string, username: string) => void
}) {
  const [showReplies, setShowReplies] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
        <img
          src={comment.author?.avatar || `https://ui-avatars.com/api/?name=${comment.author?.username}`}
          alt={comment.author?.username}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/user/${comment.author?.username}`}
              className="font-medium text-gray-800 hover:text-primary-600"
            >
              {comment.author?.username}
            </Link>
            <span className="text-gray-400 text-sm">
              {dayjs(comment.createdAt).fromNow()}
            </span>
          </div>
          <p className="text-gray-700">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onReply(comment.id, comment.author.username)}
              className="text-sm text-gray-500 hover:text-primary-600"
            >
              回复
            </button>
            {comment.replyCount > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-sm text-gray-500 hover:text-primary-600"
              >
                {showReplies ? '收起回复' : `查看回复 (${comment.replyCount})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplies && (
        <div className="ml-12 border-l-2 border-gray-100 pl-4">
          <ReplyList commentId={comment.id} onReply={onReply} />
        </div>
      )}
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
    return <div className="text-sm text-gray-400 py-2">加载中...</div>
  }

  const replies = repliesData?.data || []

  return (
    <div className="space-y-3">
      {replies.map((reply: Comment) => (
        <div key={reply.id} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-50">
          <img
            src={reply.author?.avatar || `https://ui-avatars.com/api/?name=${reply.author?.username}`}
            alt={reply.author?.username}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Link
                to={`/user/${reply.author?.username}`}
                className="font-medium text-sm text-gray-800 hover:text-primary-600"
              >
                {reply.author?.username}
              </Link>
              <span className="text-gray-400 text-xs">
                {dayjs(reply.createdAt).fromNow()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{reply.content}</p>
            <button
              onClick={() => onReply(reply.id, reply.author.username)}
              className="text-xs text-gray-500 hover:text-primary-600 mt-1"
            >
              回复
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
