import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  FiArrowUpRight,
  FiBookOpen,
  FiColumns,
  FiCompass,
  FiEdit3,
  FiEye,
  FiGrid,
  FiHeart,
  FiList,
  FiMessageCircle,
  FiZap,
} from 'react-icons/fi'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { blogApi } from '@/api/blog'
import { categoryApi, tagApi } from '@/api/category'
import { seriesApi } from '@/api/series'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore, type AmbientMood } from '@/stores/uiStore'
import EditorialCover from '@/components/editorial/EditorialCover'
import type { BlogListItem, Category } from '@/types'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const MOOD_CYCLE: AmbientMood[] = ['clay', 'sage', 'slate', 'ochre', 'plum']

const MOOD_OPTIONS: { id: AmbientMood; label: string; dot: string }[] = [
  { id: 'default', label: '暖雾', dot: '#C9B8A3' },
  { id: 'clay', label: '赤陶', dot: '#BF5B3D' },
  { id: 'sage', label: '青茗', dot: '#5B7A67' },
  { id: 'slate', label: '雾蓝', dot: '#576C82' },
  { id: 'ochre', label: '琥珀', dot: '#C99342' },
  { id: 'plum', label: '暮紫', dot: '#7E5E7A' },
]

type StreamViewMode = 'gallery' | 'bento' | 'list'

const EDITORIAL_SLOTS = [
  {
    colClass: 'lg:col-span-5 lg:col-start-1',
    aspect: 'aspect-[4/3]',
    parallaxSpeed: -14,
  },
  {
    colClass: 'lg:col-span-6 lg:col-start-7 lg:mt-16',
    aspect: 'aspect-[16/10]',
    parallaxSpeed: 20,
  },
  {
    colClass: 'lg:col-span-8 lg:col-start-3 my-2',
    aspect: 'aspect-[16/9]',
    parallaxSpeed: -10,
  },
  {
    colClass: 'lg:col-span-5 lg:col-start-2',
    aspect: 'aspect-[5/4]',
    parallaxSpeed: 16,
  },
  {
    colClass: 'lg:col-span-5 lg:col-start-8 lg:mt-14',
    aspect: 'aspect-[4/3]',
    parallaxSpeed: -16,
  },
]

function StaggeredBlogCard({
  post,
  index,
  categoryName,
  hoveredId,
  onHoverStart,
  onHoverEnd,
}: {
  post: BlogListItem
  index: number
  categoryName: string
  hoveredId: string | null
  onHoverStart: (post: BlogListItem, idx: number) => void
  onHoverEnd: () => void
}) {
  const itemRef = useRef<HTMLElement>(null)
  const slot = EDITORIAL_SLOTS[index % EDITORIAL_SLOTS.length]

  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ['start end', 'end start'],
  })

  const yOffset = useTransform(scrollYProgress, [0, 1], [slot.parallaxSpeed, -slot.parallaxSpeed])
  const smoothY = useSpring(yOffset, { stiffness: 120, damping: 28 })

  const isDimmed = hoveredId !== null && hoveredId !== post.id

  return (
    <motion.article
      ref={itemRef}
      style={{ y: smoothY }}
      onMouseEnter={() => onHoverStart(post, index)}
      onMouseLeave={onHoverEnd}
      className={`col-span-12 ${slot.colClass} group transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isDimmed ? 'opacity-50 scale-[0.985]' : 'opacity-100 scale-100'
      }`}
    >
      <Link to={`/blog/${post.id}`} className="block space-y-4">
        <EditorialCover
          src={post.image}
          title={post.title}
          summary={post.summary}
          seed={post.id}
          category={categoryName}
          aspectClass={slot.aspect}
          cursorLabel="阅读全文"
        />

        <div className="px-1 pt-1 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-ink-400">
            <div className="flex items-center gap-2">
              <span className="badge">{categoryName}</span>
              <span>{dayjs(post.createdAt).fromNow()}</span>
            </div>
            <span className="font-editorial-mono text-[11px]">
              NO.{String(post.id).padStart(2, '0')} · 约 {post.readTime || 3} 分钟
            </span>
          </div>

          <h3 className="font-editorial-serif text-2xl sm:text-[1.75rem] font-semibold text-ink-800 dark:text-ink-50 leading-snug">
            <span className="editorial-link">{post.title}</span>
          </h3>

          {post.summary && (
            <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-300 line-clamp-2 leading-relaxed">
              {post.summary}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between text-xs text-ink-400 border-t border-hairline-light dark:border-hairline-dark">
            <div className="flex items-center gap-2">
              <img
                src={
                  post.author?.avatar ||
                  `https://ui-avatars.com/api/?name=${post.author?.username}&background=9E6B52&color=FAF8F4`
                }
                alt={post.author?.username}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="font-medium text-ink-700 dark:text-ink-200">
                {post.author?.username || '作者'}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="inline-flex items-center gap-1">
                <FiEye size={13} /> {post.views || 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <FiHeart size={13} /> {post.likesCount || 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <FiMessageCircle size={13} /> {post.commentCount || 0}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const { ambientMood, setAmbientMood } = useUIStore()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [streamViewMode, setStreamViewMode] = useState<StreamViewMode>('gallery')
  const [hoveredGalleryId, setHoveredGalleryId] = useState<string | null>(null)
  const [hoveredIndexPost, setHoveredIndexPost] = useState<BlogListItem | null>(null)

  useEffect(() => {
    return () => setAmbientMood('default')
  }, [setAmbientMood])

  // 3D Tilt spring physics for Flagship Cover Card
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const smoothRotateX = useSpring(tiltX, { stiffness: 200, damping: 24 })
  const smoothRotateY = useSpring(tiltY, { stiffness: 200, damping: 24 })

  const handleHeroCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5
    tiltX.set(-relY * 5.5)
    tiltY.set(relX * 6.5)
  }

  const handleHeroCardMouseLeave = () => {
    tiltX.set(0)
    tiltY.set(0)
  }

  const previewX = useMotionValue(0)
  const previewY = useMotionValue(0)
  const smoothPreviewX = useSpring(previewX, { stiffness: 260, damping: 28, mass: 0.5 })
  const smoothPreviewY = useSpring(previewY, { stiffness: 260, damping: 28, mass: 0.5 })

  const { data: blogsData, isLoading: isBlogsLoading } = useQuery({
    queryKey: ['blogs', selectedCategoryId],
    queryFn: () =>
      selectedCategoryId
        ? blogApi.getBlogsByCategory(selectedCategoryId, 0, 14)
        : blogApi.getBlogs(0, 14),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['popular-tags'],
    queryFn: () => tagApi.getPopular(),
  })

  const { data: seriesData } = useQuery({
    queryKey: ['home-series'],
    queryFn: () => seriesApi.getSeriesList(0, 3),
  })

  const blogs = blogsData?.data?.content || []
  const categories: Category[] = categoriesData?.data || []
  const tags = tagsData?.data || []
  const seriesList = (seriesData?.data?.content || []).filter((s) => Boolean(s.title?.trim()))

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories) {
      map.set(String(c.id), c.name)
    }
    return map
  }, [categories])

  const resolveCategoryName = (post: BlogListItem, fallback = '精选文章') => {
    if (post.category) return post.category
    if (post.categoryId) return categoryMap.get(String(post.categoryId)) || fallback
    return fallback
  }

  const isFiltered = Boolean(selectedCategoryId)
  const leadPost = !isFiltered ? blogs[0] : null
  const curatedPicks = !isFiltered ? blogs.slice(1, 4) : []
  const galleryPosts = !isFiltered
    ? blogs.length > 1
      ? blogs.slice(1, 7)
      : blogs
    : blogs
  const indexPosts = blogs

  const totalViews = useMemo(
    () => blogs.reduce((acc, item) => acc + (item.views || 0), 0),
    [blogs]
  )

  const handleGalleryHoverStart = (post: BlogListItem, idx: number) => {
    setHoveredGalleryId(post.id)
    setAmbientMood(MOOD_CYCLE[idx % MOOD_CYCLE.length])
  }

  const handleGalleryHoverEnd = () => {
    setHoveredGalleryId(null)
  }

  const handleIndexMouseMove = (e: React.MouseEvent) => {
    previewX.set(e.clientX + 28)
    previewY.set(e.clientY - 85)
  }

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* ACT 0: Editorial Issue Strip & Interactive Ambient Mood Controller */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-hairline-light dark:border-hairline-dark text-xs">
        <div className="flex flex-wrap items-center gap-3 text-ink-500 dark:text-ink-300">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-vermilion/10 text-vermilion font-editorial-mono text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-vermilion animate-pulse" />
            ISSUE 2026 · 独立技术与人文数字刊物
          </span>
          <span className="hidden sm:inline text-ink-300 dark:text-ink-600">|</span>
          <span className="hidden sm:inline text-ink-400">
            收录 <strong className="text-ink-700 dark:text-ink-100">{blogs.length}</strong> 篇深度文章 · 累计{' '}
            <strong className="text-ink-700 dark:text-ink-100">{totalViews}</strong> 次阅读
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-400 mr-1 hidden md:inline">氛围光境：</span>
          {MOOD_OPTIONS.map((m) => {
            const active = ambientMood === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setAmbientMood(m.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all ${
                  active
                    ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-medium shadow-sm'
                    : 'bg-paper-200/60 dark:bg-white/[0.04] text-ink-500 dark:text-ink-300 hover:text-ink-800 dark:hover:text-ink-100'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: m.dot }}
                />
                <span>{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ACT I: 12-Column Asymmetric Bento Hero Showcase */}
      {isBlogsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 animate-pulse">
          <div className="lg:col-span-7 h-[520px] rounded-3xl bg-paper-200 dark:bg-ink-800" />
          <div className="lg:col-span-5 h-[520px] rounded-3xl bg-paper-200 dark:bg-ink-800" />
        </div>
      ) : leadPost ? (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
          {/* Left 7 Cols: Flagship Cover Story with 3D Spring Tilt */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onMouseMove={handleHeroCardMouseMove}
            onMouseLeave={handleHeroCardMouseLeave}
            style={{
              rotateX: smoothRotateX,
              rotateY: smoothRotateY,
              transformPerspective: 1200,
            }}
            className="lg:col-span-7 card p-6 sm:p-8 flex flex-col justify-between gap-6 hover:transform-none"
          >
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="badge badge-vermilion">头条封面 · COVER STORY</span>
                  <span className="badge">{resolveCategoryName(leadPost, '精选专栏')}</span>
                </div>
                <span className="font-editorial-mono text-xs text-ink-400">
                  NO.{String(leadPost.id).padStart(3, '0')} · 约 {leadPost.readTime || 5} 分钟阅读
                </span>
              </div>

              <Link to={`/blog/${leadPost.id}`} className="block group space-y-4">
                <h1 className="font-editorial-serif font-semibold text-3xl sm:text-4xl xl:text-[2.75rem] leading-[1.14] tracking-tight text-ink-800 dark:text-ink-50 group-hover:text-vermilion transition-colors">
                  {leadPost.title}
                </h1>

                <p className="font-reading-serif text-sm sm:text-base text-ink-500 dark:text-ink-300 leading-relaxed line-clamp-3">
                  {leadPost.summary ||
                    '点击进入阅读完整文章内容，探索现代前端工程、系统架构设计与视觉排版的深度思考。'}
                </p>
              </Link>

              <Link to={`/blog/${leadPost.id}`} className="block">
                <EditorialCover
                  src={leadPost.image}
                  title={leadPost.title}
                  summary={leadPost.summary}
                  seed={leadPost.id}
                  category={resolveCategoryName(leadPost, '置顶精选')}
                  aspectClass="aspect-[16/9]"
                  cursorLabel="阅读全文"
                />
              </Link>
            </div>

            <div className="pt-4 border-t border-hairline-light dark:border-hairline-dark flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  to={`/user/${leadPost.author?.username}`}
                  className="flex items-center gap-2.5 group"
                >
                  <img
                    src={
                      leadPost.author?.avatar ||
                      `https://ui-avatars.com/api/?name=${leadPost.author?.username}&background=9E6B52&color=FAF8F4`
                    }
                    alt={leadPost.author?.username}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-white/10"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink-800 dark:text-ink-100 group-hover:text-vermilion transition-colors">
                      {leadPost.author?.username || '主理人'}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      {dayjs(leadPost.createdAt).format('YYYY年MM月DD日')}
                    </p>
                  </div>
                </Link>

                <div className="hidden sm:flex items-center gap-3 text-xs text-ink-400 pl-3 border-l border-hairline-light dark:border-hairline-dark">
                  <span className="inline-flex items-center gap-1">
                    <FiEye size={13} /> {leadPost.views || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiHeart size={13} /> {leadPost.likesCount || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiMessageCircle size={13} /> {leadPost.commentCount || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link to={`/blog/${leadPost.id}`} className="btn btn-primary btn-sm">
                  <span>立即阅读</span>
                  <FiArrowUpRight size={14} />
                </Link>
                <Link
                  to={isAuthenticated ? '/editor' : '/login'}
                  className="btn btn-secondary btn-sm"
                >
                  <FiEdit3 size={13} />
                  <span>发布创作</span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right 5 Cols: Editor's Picks Stack + Studio Atelier Card */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            {/* Editor's Curated Picks Card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="card p-6 space-y-5 flex-1 hover:transform-none"
            >
              <div className="flex items-center justify-between pb-3 border-b border-hairline-light dark:border-hairline-dark">
                <div className="flex items-center gap-2">
                  <FiZap size={14} className="text-vermilion" />
                  <h2 className="font-editorial-serif text-xl font-bold text-ink-800 dark:text-ink-50">
                    编辑部精选 · Editor&apos;s Picks
                  </h2>
                </div>
                <span className="font-editorial-mono text-[10px] uppercase tracking-widest text-ink-400">
                  TOP CURATED
                </span>
              </div>

              <div className="divide-y divide-hairline-light dark:divide-hairline-dark">
                {curatedPicks.map((item, idx) => (
                  <Link
                    key={item.id}
                    to={`/blog/${item.id}`}
                    onMouseEnter={() => setAmbientMood(MOOD_CYCLE[(idx + 1) % MOOD_CYCLE.length])}
                    className="group py-3.5 first:pt-1 last:pb-1 flex items-center gap-4"
                  >
                    <span className="font-editorial-mono text-xs font-semibold text-vermilion/80 w-5 shrink-0">
                      0{idx + 1}
                    </span>

                    <div className="w-20 shrink-0">
                      <EditorialCover
                        src={item.image}
                        title={item.title}
                        seed={item.id}
                        aspectClass="aspect-[4/3]"
                        roundedClass="rounded-xl"
                        compact
                        curtainReveal={false}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-ink-400">
                        <span className="text-vermilion font-medium">
                          {resolveCategoryName(item)}
                        </span>
                        <span>·</span>
                        <span>{item.readTime || 4} 分钟</span>
                      </div>
                      <h3 className="font-editorial-serif text-base font-bold text-ink-800 dark:text-ink-100 line-clamp-2 leading-snug group-hover:text-vermilion transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-ink-400">
                        <span>{item.author?.username}</span>
                        <span className="inline-flex items-center gap-1">
                          <FiEye size={11} /> {item.views || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Quick Atelier Navigation & Topic Pulse Card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="card p-5 space-y-4 hover:transform-none"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-700 dark:text-ink-200 flex items-center gap-1.5">
                  <FiCompass size={13} className="text-vermilion" />
                  <span>探索频道与热门议题</span>
                </span>
                <Link
                  to="/search"
                  className="text-[11px] text-vermilion hover:underline inline-flex items-center gap-0.5"
                >
                  <span>全站检索</span>
                  <FiArrowUpRight size={12} />
                </Link>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.slice(0, 8).map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/tag/${tag.id}`}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-paper-200/70 dark:bg-white/[0.05] border border-hairline-light dark:border-hairline-dark text-ink-600 dark:text-ink-300 hover:border-vermilion hover:text-vermilion transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-1">
                <Link
                  to="/series"
                  className="p-2.5 rounded-2xl bg-paper-200/55 dark:bg-white/[0.04] hover:bg-vermilion/10 transition-colors text-center"
                >
                  <p className="font-editorial-serif text-base font-bold text-ink-800 dark:text-ink-100">
                    {seriesList.length || 2} 部
                  </p>
                  <p className="text-[10px] text-ink-400">连载专栏</p>
                </Link>
                <Link
                  to="/search"
                  className="p-2.5 rounded-2xl bg-paper-200/55 dark:bg-white/[0.04] hover:bg-vermilion/10 transition-colors text-center"
                >
                  <p className="font-editorial-serif text-base font-bold text-ink-800 dark:text-ink-100">
                    {categories.length || 4} 栏
                  </p>
                  <p className="text-[10px] text-ink-400">主题分类</p>
                </Link>
                <Link
                  to={isAuthenticated ? '/editor' : '/login'}
                  className="p-2.5 rounded-2xl bg-vermilion/10 hover:bg-vermilion/20 transition-colors text-center"
                >
                  <p className="font-editorial-serif text-base font-bold text-vermilion">
                    创作台
                  </p>
                  <p className="text-[10px] text-vermilion/80">Markdown</p>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* ACT II: Multi-View Switchable Article Stream + Morphing Category Filter */}
      <section className="space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-hairline-light dark:border-hairline-dark">
          <div>
            <p className="font-editorial-mono text-[10px] uppercase tracking-[0.22em] text-vermilion mb-1">
              SELECTED PUBLICATIONS
            </p>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl font-semibold text-ink-800 dark:text-ink-50">
              精选博客文章
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
            {/* Category Pills */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap ${
                    selectedCategoryId === null
                      ? 'text-paper-50 dark:text-ink-900 font-medium'
                      : 'text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-100'
                  }`}
                >
                  {selectedCategoryId === null && (
                    <motion.span
                      layoutId="blog-category-pill"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-ink-800 dark:bg-ink-50 -z-10"
                    />
                  )}
                  全部文章
                </button>
                {categories.map((cat) => {
                  const active = selectedCategoryId === String(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(active ? null : String(cat.id))}
                      className={`relative px-3.5 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap ${
                        active
                          ? 'text-paper-50 dark:text-ink-900 font-medium'
                          : 'text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-100'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="blog-category-pill"
                          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                          className="absolute inset-0 rounded-full bg-ink-800 dark:bg-ink-50 -z-10"
                        />
                      )}
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            )}

            {/* 3-Mode View Switcher */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-paper-200/75 dark:bg-white/[0.05] border border-hairline-light dark:border-hairline-dark">
              <button
                type="button"
                onClick={() => setStreamViewMode('gallery')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                  streamViewMode === 'gallery'
                    ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-medium'
                    : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-100'
                }`}
                title="杂志视差画廊"
              >
                <FiColumns size={12} />
                <span className="hidden sm:inline">画廊</span>
              </button>
              <button
                type="button"
                onClick={() => setStreamViewMode('bento')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                  streamViewMode === 'bento'
                    ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-medium'
                    : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-100'
                }`}
                title="双栏卡片网格"
              >
                <FiGrid size={12} />
                <span className="hidden sm:inline">网格</span>
              </button>
              <button
                type="button"
                onClick={() => setStreamViewMode('list')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                  streamViewMode === 'list'
                    ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-medium'
                    : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-100'
                }`}
                title="极简目录视图"
              >
                <FiList size={12} />
                <span className="hidden sm:inline">目录</span>
              </button>
            </div>
          </div>
        </div>

        {galleryPosts.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <p className="font-editorial-serif text-2xl text-ink-500">
              {isFiltered ? '该分类下暂无博客文章' : '暂无已发布的博客文章'}
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="btn btn-secondary btn-sm"
              >
                查看全部文章
              </button>
            )}
          </div>
        ) : streamViewMode === 'gallery' ? (
          <div className="grid grid-cols-12 gap-y-14 sm:gap-y-20 sm:gap-x-10 items-start">
            {galleryPosts.map((post, idx) => (
              <StaggeredBlogCard
                key={post.id}
                post={post}
                index={idx}
                categoryName={resolveCategoryName(post)}
                hoveredId={hoveredGalleryId}
                onHoverStart={handleGalleryHoverStart}
                onHoverEnd={handleGalleryHoverEnd}
              />
            ))}
          </div>
        ) : streamViewMode === 'bento' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((post) => {
              const catName = resolveCategoryName(post)
              return (
                <Link
                  key={post.id}
                  to={`/blog/${post.id}`}
                  className="card p-5 flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3.5">
                    <EditorialCover
                      src={post.image}
                      title={post.title}
                      seed={post.id}
                      category={catName}
                      aspectClass="aspect-[16/10]"
                      curtainReveal={false}
                    />
                    <div className="flex items-center justify-between text-xs text-ink-400">
                      <span className="badge">{catName}</span>
                      <span>约 {post.readTime || 4} 分钟</span>
                    </div>
                    <h3 className="font-editorial-serif text-xl font-bold text-ink-800 dark:text-ink-50 group-hover:text-vermilion transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.summary && (
                      <p className="text-xs text-ink-500 dark:text-ink-300 line-clamp-2 leading-relaxed">
                        {post.summary}
                      </p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs text-ink-400">
                    <span>{post.author?.username}</span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <FiEye size={12} /> {post.views || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiHeart size={12} /> {post.likesCount || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="card divide-y divide-hairline-light dark:divide-hairline-dark p-2 sm:p-4 hover:transform-none">
            {blogs.map((post, idx) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl hover:bg-paper-200/50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-editorial-mono text-xs text-vermilion w-7 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-editorial-serif text-lg font-bold text-ink-800 dark:text-ink-50 truncate group-hover:text-vermilion transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-ink-400 truncate mt-0.5">{post.summary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-ink-400 shrink-0">
                  <span className="badge">{resolveCategoryName(post)}</span>
                  <span>{dayjs(post.createdAt).format('YYYY.MM.DD')}</span>
                  <FiArrowUpRight size={14} className="group-hover:text-vermilion" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ACT III: Hardcover Monograph Series Volumes (系列专栏连载) */}
      {!isFiltered && seriesList.length > 0 && (
        <section className="space-y-8 pt-2">
          <div className="flex items-end justify-between border-b border-hairline-light dark:border-hairline-dark pb-4">
            <div>
              <p className="font-editorial-mono text-[10px] uppercase tracking-[0.22em] text-vermilion mb-1">
                MONOGRAPH VOLUMES · 系列专栏
              </p>
              <h2 className="font-editorial-serif text-3xl sm:text-4xl font-semibold text-ink-800 dark:text-ink-50">
                专题深度连载
              </h2>
            </div>
            <Link
              to="/series"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-vermilion transition-colors"
            >
              <span>浏览全部专栏</span>
              <FiArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {seriesList.slice(0, 3).map((series, idx) => (
              <Link
                key={series.id}
                to={`/series/${series.id}`}
                onMouseEnter={() => setAmbientMood(MOOD_CYCLE[(idx + 2) % MOOD_CYCLE.length])}
                className="group card p-5 pl-7 relative overflow-hidden flex flex-col justify-between gap-4"
              >
                {/* Hardcover Book Spine Groove */}
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-ink-900/15 via-vermilion/25 to-transparent dark:from-white/15 dark:via-vermilion/20 border-r border-hairline-light dark:border-hairline-dark"
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-editorial-mono text-[11px] font-semibold text-vermilion">
                      VOL. 0{idx + 1} · 专题丛书
                    </span>
                    <span className="badge">
                      <FiBookOpen size={11} className="mr-1" />
                      {series.status === 'Completed' ? '已完结' : '连载中'}
                    </span>
                  </div>

                  <EditorialCover
                    src={series.coverUrl}
                    title={series.title}
                    summary={series.description}
                    seed={`series-${series.id}`}
                    badgeText={`VOLUME 0${idx + 1}`}
                    aspectClass="aspect-[16/10]"
                    cursorLabel="阅读专栏"
                    curtainReveal={false}
                  />

                  <div className="space-y-1.5">
                    <h3 className="font-editorial-serif text-2xl font-bold text-ink-800 dark:text-ink-50 group-hover:text-vermilion transition-colors">
                      {series.title}
                    </h3>
                    {series.description && (
                      <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 line-clamp-2 leading-relaxed">
                        {series.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs text-ink-400">
                  <span>作者：{series.author?.username || 'admin'}</span>
                  <span className="inline-flex items-center gap-1 text-vermilion font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>进入章节目录</span>
                    <FiArrowUpRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ACT IV: Quick Article Archive Index + Floating Hover Preview Card */}
      {indexPosts.length > 0 && (
        <section
          onMouseMove={handleIndexMouseMove}
          onMouseLeave={() => setHoveredIndexPost(null)}
          className="relative space-y-8 pt-2"
        >
          <div className="flex items-end justify-between border-b border-hairline-light dark:border-hairline-dark pb-4">
            <div>
              <p className="font-editorial-mono text-[10px] uppercase tracking-[0.22em] text-ink-400 mb-1">
                CHRONOLOGICAL INDEX
              </p>
              <h2 className="font-editorial-serif text-3xl sm:text-4xl font-semibold text-ink-800 dark:text-ink-50">
                最新文章速览索引
              </h2>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-vermilion transition-colors"
            >
              <span>进入文章搜索与归档</span>
              <FiArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-hairline-light dark:divide-hairline-dark border-b border-hairline-light dark:border-hairline-dark">
            {indexPosts.slice(0, 8).map((post, idx) => {
              const isRowHovered = hoveredIndexPost?.id === post.id
              const isDimmed = hoveredIndexPost !== null && !isRowHovered
              const catLabel = resolveCategoryName(post, '')

              return (
                <Link
                  key={post.id}
                  to={`/blog/${post.id}`}
                  data-cursor="阅读全文"
                  onMouseEnter={() => {
                    setHoveredIndexPost(post)
                    setAmbientMood(MOOD_CYCLE[idx % MOOD_CYCLE.length])
                  }}
                  className={`group py-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 transition-all duration-500 ${
                    isDimmed ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-baseline gap-5 min-w-0">
                    <span className="font-editorial-mono text-xs text-ink-400 w-7 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-editorial-serif text-xl sm:text-2xl font-medium text-ink-800 dark:text-ink-50 truncate group-hover:translate-x-2.5 group-hover:text-vermilion transition-all duration-500">
                      {post.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-5 text-xs text-ink-400 shrink-0 pl-12 sm:pl-0">
                    {catLabel && <span className="badge">{catLabel}</span>}
                    <span>{post.author?.username}</span>
                    <span className="font-editorial-mono">{dayjs(post.createdAt).format('MM-DD')}</span>
                    <FiArrowUpRight
                      size={15}
                      className="group-hover:text-vermilion group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Floating Mid-Air Summary & Cover Preview Card (Desktop) */}
          <AnimatePresence>
            {hoveredIndexPost && (
              <motion.div
                aria-hidden
                style={{ x: smoothPreviewX, y: smoothPreviewY }}
                initial={{ opacity: 0, scale: 0.88, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 1 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none fixed top-0 left-0 z-40 hidden lg:block w-72 rounded-2xl overflow-hidden shadow-editorial-float bg-[#FAF8F4]/95 dark:bg-[#191817]/95 backdrop-blur-xl p-2 border border-hairline-light dark:border-hairline-dark"
              >
                <EditorialCover
                  src={hoveredIndexPost.image}
                  title={hoveredIndexPost.title}
                  summary={hoveredIndexPost.summary}
                  seed={hoveredIndexPost.id}
                  category={resolveCategoryName(hoveredIndexPost, '阅读预览')}
                  aspectClass="aspect-[16/10]"
                  curtainReveal={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popular Blog Tags */}
          {tags.length > 0 && (
            <div className="pt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink-400 mr-2">热门议题标签：</span>
              {tags.slice(0, 16).map((tag) => (
                <Link
                  key={tag.id}
                  to={`/tag/${tag.id}`}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-[#FAF8F4]/75 dark:bg-white/[0.05] border border-hairline-light dark:border-hairline-dark text-ink-600 dark:text-ink-300 hover:border-vermilion hover:text-vermilion transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
