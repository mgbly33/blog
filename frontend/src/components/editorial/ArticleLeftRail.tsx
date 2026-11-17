import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowUp,
  FiBookmark,
  FiEdit3,
  FiHeadphones,
  FiHeart,
  FiMail,
  FiMaximize2,
  FiMessageCircle,
  FiPause,
  FiPlay,
  FiShare2,
  FiSquare,
  FiUser,
  FiUserCheck,
  FiUserPlus,
} from 'react-icons/fi'
import { userApi } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore, type PaperTint, type ReaderFontSize } from '@/stores/uiStore'
import type { Blog } from '@/types'

const FONT_SIZES: ReaderFontSize[] = ['sm', 'md', 'lg']

const PAPER_TINTS: { id: PaperTint; label: string; swatch: string }[] = [
  { id: 'oat', label: '暖燕麦', swatch: '#F5F2EB' },
  { id: 'sage', label: '青茗纸', swatch: '#EEF3EE' },
  { id: 'parchment', label: '古羊皮', swatch: '#F6EFE2' },
  { id: 'porcelain', label: '素宣白', swatch: '#F7F8FA' },
]

interface ArticleLeftRailProps {
  blog: Blog
  readingProgress: number
  totalCommentCount: number
  onToggleLike: () => void
  onToggleBookmark: () => void
  onScrollToComments: () => void
  onShare: () => void
  onReport: () => void
  onEnterZen: () => void
  likePending: boolean
  bookmarkPending: boolean
}

export default function ArticleLeftRail({
  blog,
  readingProgress,
  totalCommentCount,
  onToggleLike,
  onToggleBookmark,
  onScrollToComments,
  onShare,
  onReport,
  onEnterZen,
  likePending,
  bookmarkPending,
}: ArticleLeftRailProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const {
    theme,
    paperTint,
    readerFontSize,
    readerFontFamily,
    setPaperTint,
    setReaderFontSize,
    setReaderFontFamily,
  } = useUIStore()

  // Web Speech API state for "AI 听文章"
  const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle')

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [blog.id])

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('当前浏览器暂不支持语音朗读')
      return
    }

    const synth = window.speechSynthesis
    if (speechState === 'playing') {
      synth.pause()
      setSpeechState('paused')
      return
    }
    if (speechState === 'paused') {
      synth.resume()
      setSpeechState('playing')
      return
    }

    synth.cancel()
    const cleanBody = (blog.rawContent || blog.content || '')
      .replace(/```[\s\S]*?```/g, '代码片段略。')
      .replace(/[#>*_`~[\]()!-]/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const textToRead = `${blog.title}。${blog.summary ? blog.summary + '。' : ''}${cleanBody.slice(0, 2500)}`
    const utterance = new SpeechSynthesisUtterance(textToRead)
    utterance.lang = 'zh-CN'
    utterance.rate = 1.02
    utterance.onend = () => setSpeechState('idle')
    utterance.onerror = () => setSpeechState('idle')

    synth.speak(utterance)
    setSpeechState('playing')
    toast.success('开始为您朗读文章')
  }

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeechState('idle')
  }

  const authorUsername = blog.author?.username
  const isOwnAuthor = Boolean(
    user?.id && blog.author?.id && String(user.id) === String(blog.author.id)
  )

  const { data: authorProfileData } = useQuery({
    queryKey: ['user', authorUsername],
    queryFn: () => userApi.getUserByUsername(authorUsername!),
    enabled: Boolean(authorUsername),
  })

  const authorProfile = authorProfileData?.data

  const followMutation = useMutation({
    mutationFn: (targetUserId: string) => userApi.toggleFollow(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', authorUsername] })
      toast.success('已更新关注状态')
    },
    onError: () => toast.error('操作失败，请稍后重试'),
  })

  const handleFollowClick = () => {
    if (!isAuthenticated) {
      toast.error('请先登录后关注作者')
      navigate('/login')
      return
    }
    if (blog.author?.id) {
      followMutation.mutate(String(blog.author.id))
    }
  }

  return (
    <aside className="hidden xl:block w-[264px] shrink-0">
      <div className="sticky top-24 space-y-5">
        {/* Card 1: Author Folio Card with Morandi Gradient Header */}
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="card p-0 overflow-hidden hover:transform-none"
        >
          {/* Decorative Morandi Header Strip */}
          <div
            aria-hidden
            className="h-16 w-full relative overflow-hidden"
            style={{
              background:
                'linear-gradient(125deg, rgba(191,91,61,0.22) 0%, rgba(158,107,82,0.18) 48%, rgba(91,122,103,0.22) 100%)',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-end px-4">
              <span className="font-editorial-mono text-[10px] uppercase tracking-[0.2em] text-ink-600/60 dark:text-ink-200/60">
                AUTHOR FOLIO
              </span>
            </div>
          </div>

          <div className="px-5 pb-5 -mt-6 space-y-4 relative z-10">
            <div className="flex items-end gap-3.5">
              <Link to={`/user/${authorUsername}`} className="shrink-0">
                <img
                  src={
                    authorProfile?.avatar ||
                    blog.author?.avatar ||
                    `https://ui-avatars.com/api/?name=${authorUsername}&background=9E6B52&color=FAF8F4`
                  }
                  alt={authorUsername}
                  className="w-14 h-14 rounded-2xl object-cover ring-4 ring-[#FAF8F4] dark:ring-[#1E1D1B] shadow-md"
                />
              </Link>
              <div className="min-w-0 pb-0.5">
                <Link
                  to={`/user/${authorUsername}`}
                  className="block font-editorial-serif text-xl font-bold text-ink-900 dark:text-ink-50 hover:text-vermilion transition-colors truncate"
                >
                  {authorUsername}
                </Link>
                <span className="inline-flex items-center gap-1 text-[11px] text-vermilion font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-vermilion" />
                  {authorProfile?.isAdmin || authorProfile?.role === 'ADMIN'
                    ? '社区主理人 · 专栏作家'
                    : '专栏创作者'}
                </span>
              </div>
            </div>

            <p className="text-xs text-ink-500 dark:text-ink-300 leading-relaxed line-clamp-3">
              {authorProfile?.bio ||
                '专注于现代前端视觉工程、高并发架构设计与文字排版美学，在这里记录值得反复翻阅的深度思考。'}
            </p>

            <div className="grid grid-cols-3 gap-2 py-2.5 px-2 rounded-2xl bg-paper-200/55 dark:bg-white/[0.04] text-center">
              <div>
                <p className="font-editorial-serif text-lg font-bold text-ink-800 dark:text-ink-50 leading-none">
                  {authorProfile?.blogCount ?? 5}
                </p>
                <p className="text-[10px] text-ink-400 mt-1">文章</p>
              </div>
              <div className="border-x border-hairline-light dark:border-hairline-dark">
                <p className="font-editorial-serif text-lg font-bold text-ink-800 dark:text-ink-50 leading-none">
                  {authorProfile?.receivedLikeCount ??
                    authorProfile?.likeCount ??
                    blog.likesCount ??
                    0}
                </p>
                <p className="text-[10px] text-ink-400 mt-1">获赞</p>
              </div>
              <div>
                <p className="font-editorial-serif text-lg font-bold text-ink-800 dark:text-ink-50 leading-none">
                  {authorProfile?.followerCount ?? 0}
                </p>
                <p className="text-[10px] text-ink-400 mt-1">关注者</p>
              </div>
            </div>

            {isOwnAuthor ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to={`/user/${authorUsername}`} className="btn btn-secondary btn-sm text-xs">
                  <FiUser size={12} />
                  <span>我的主页</span>
                </Link>
                <Link to="/editor" className="btn btn-primary btn-sm text-xs">
                  <FiEdit3 size={12} />
                  <span>写新文章</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFollowClick}
                  disabled={followMutation.isPending}
                  className={`flex-1 ${
                    authorProfile?.isFollowing ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'
                  }`}
                >
                  {authorProfile?.isFollowing ? (
                    <FiUserCheck size={13} />
                  ) : (
                    <FiUserPlus size={13} />
                  )}
                  <span>{authorProfile?.isFollowing ? '已关注' : '关注作者'}</span>
                </button>
                {isAuthenticated && blog.author?.id && (
                  <Link
                    to={`/messages?to=${blog.author.id}`}
                    className="btn btn-secondary btn-sm px-3"
                    title="给作者发私信"
                  >
                    <FiMail size={13} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Card 2: AI Voice Narration + Reading & Engagement Studio */}
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="card p-5 space-y-4 hover:transform-none"
        >
          {/* AI Voice Reader Widget */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-vermilion/10 via-amber-500/5 to-transparent border border-vermilion/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-vermilion text-white flex items-center justify-center shrink-0 shadow-sm">
                <FiHeadphones size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-800 dark:text-ink-100 truncate">
                  {speechState === 'playing'
                    ? '正在朗读全文...'
                    : speechState === 'paused'
                    ? '语音朗读已暂停'
                    : 'AI 语音听文章'}
                </p>
                <p className="text-[10px] text-ink-400">
                  约 {blog.readTime || 4} 分钟 · 中文自然播报
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleToggleSpeech}
                className="w-7 h-7 rounded-full bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 flex items-center justify-center hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors"
                title={speechState === 'playing' ? '暂停朗读' : '开始朗读'}
              >
                {speechState === 'playing' ? <FiPause size={12} /> : <FiPlay size={12} />}
              </button>
              {speechState !== 'idle' && (
                <button
                  type="button"
                  onClick={handleStopSpeech}
                  className="w-7 h-7 rounded-full bg-paper-200 dark:bg-white/10 text-ink-600 dark:text-ink-200 flex items-center justify-center hover:text-rose-500 transition-colors"
                  title="停止朗读"
                >
                  <FiSquare size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">
              互动与阅读工坊
            </span>
            <span className="font-editorial-mono text-[11px] text-vermilion font-medium">
              已读 {Math.round(readingProgress)}%
            </span>
          </div>

          {/* 2x2 Engagement Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleLike}
              disabled={likePending}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-medium border transition-all ${
                blog.isLiked
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-paper-100/80 dark:bg-white/[0.04] text-ink-700 dark:text-ink-200 border-hairline-light dark:border-hairline-dark hover:border-rose-400/50 hover:text-rose-500'
              }`}
            >
              <FiHeart size={14} className={blog.isLiked ? 'fill-current' : ''} />
              <span>喜欢 · {blog.likesCount || 0}</span>
            </button>

            <button
              type="button"
              onClick={onToggleBookmark}
              disabled={bookmarkPending}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-medium border transition-all ${
                blog.isBookmarked
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-paper-100/80 dark:bg-white/[0.04] text-ink-700 dark:text-ink-200 border-hairline-light dark:border-hairline-dark hover:border-amber-400/50 hover:text-amber-500'
              }`}
            >
              <FiBookmark size={14} className={blog.isBookmarked ? 'fill-current' : ''} />
              <span>收藏 · {blog.collectCount || 0}</span>
            </button>

            <button
              type="button"
              onClick={onScrollToComments}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-medium bg-paper-100/80 dark:bg-white/[0.04] text-ink-700 dark:text-ink-200 border border-hairline-light dark:border-hairline-dark hover:border-vermilion/40 hover:text-vermilion transition-all"
            >
              <FiMessageCircle size={14} />
              <span>评论 · {totalCommentCount}</span>
            </button>

            <button
              type="button"
              onClick={onShare}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-medium bg-paper-100/80 dark:bg-white/[0.04] text-ink-700 dark:text-ink-200 border border-hairline-light dark:border-hairline-dark hover:border-vermilion/40 hover:text-vermilion transition-all"
            >
              <FiShare2 size={14} />
              <span>复制链接</span>
            </button>
          </div>

          {/* Paper Tint Swatches (Light Mode) + Typography Controls */}
          <div className="pt-3 border-t border-hairline-light dark:border-hairline-dark space-y-2.5">
            {theme === 'light' && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-ink-400 block">纸张底色：</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {PAPER_TINTS.map((t) => {
                    const active = paperTint === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPaperTint(t.id)}
                        className={`py-1.5 px-1 rounded-xl text-[11px] flex flex-col items-center gap-1 border transition-all ${
                          active
                            ? 'border-vermilion text-vermilion font-medium bg-vermilion/5'
                            : 'border-hairline-light text-ink-500 hover:text-ink-800'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15"
                          style={{ backgroundColor: t.swatch }}
                        />
                        <span>{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setReaderFontFamily('serif')}
                className={`py-1.5 rounded-xl text-xs font-reading-serif transition-all ${
                  readerFontFamily === 'serif'
                    ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-medium'
                    : 'bg-paper-200/70 dark:bg-white/[0.05] text-ink-600 dark:text-ink-300'
                }`}
              >
                书卷衬线
              </button>
              <button
                type="button"
                onClick={() => setReaderFontFamily('sans')}
                className={`py-1.5 rounded-xl text-xs font-sans transition-all ${
                  readerFontFamily === 'sans'
                    ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-medium'
                    : 'bg-paper-200/70 dark:bg-white/[0.05] text-ink-600 dark:text-ink-300'
                }`}
              >
                现代黑体
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {FONT_SIZES.map((sz, i) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setReaderFontSize(sz)}
                  className={`py-1 rounded-xl text-xs font-medium transition-all ${
                    readerFontSize === sz
                      ? 'bg-vermilion/15 text-vermilion border border-vermilion/30'
                      : 'bg-paper-200/60 dark:bg-white/[0.05] text-ink-500 dark:text-ink-300'
                  }`}
                >
                  {i === 0 ? 'A-' : i === 1 ? '标准' : 'A+'}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Utility Actions */}
          <div className="pt-2 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs text-ink-400">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                className="inline-flex items-center gap-1 hover:text-vermilion transition-colors font-medium text-ink-600 dark:text-ink-300"
                title="返回上一页"
              >
                <FiArrowLeft size={12} />
                <span>返回</span>
              </button>
              <button
                type="button"
                onClick={onEnterZen}
                className="inline-flex items-center gap-1 hover:text-vermilion transition-colors"
                title="收起两侧边栏，进入沉浸单栏阅读"
              >
                <FiMaximize2 size={12} />
                <span>专注</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {!isOwnAuthor && isAuthenticated && (
                <button
                  type="button"
                  onClick={onReport}
                  className="hover:text-rose-500 transition-colors"
                  title="举报内容"
                >
                  <FiAlertTriangle size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-1 hover:text-ink-800 dark:hover:text-ink-100 transition-colors"
              >
                <FiArrowUp size={12} />
                <span>顶部</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </aside>
  )
}
