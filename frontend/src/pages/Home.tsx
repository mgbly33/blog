import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiArrowRight,
  FiClock,
  FiCompass,
  FiEye,
  FiHeart,
  FiLayers,
  FiMessageCircle,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { blogApi } from '@/api/blog'
import { tagApi } from '@/api/category'
import type { BlogListItem } from '@/types'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const HERO_PARTICLES = [
  { left: '6%', top: '14%', size: 5, delay: 0.2, duration: 9.8 },
  { left: '18%', top: '62%', size: 7, delay: 0.5, duration: 11.2 },
  { left: '31%', top: '28%', size: 4, delay: 0.9, duration: 10.7 },
  { left: '44%', top: '78%', size: 6, delay: 0.3, duration: 12.5 },
  { left: '58%', top: '22%', size: 8, delay: 1.2, duration: 13.1 },
  { left: '65%', top: '66%', size: 5, delay: 0.8, duration: 9.5 },
  { left: '74%', top: '38%', size: 7, delay: 0.1, duration: 12.2 },
  { left: '82%', top: '12%', size: 4, delay: 1.6, duration: 10.4 },
  { left: '90%', top: '54%', size: 6, delay: 0.7, duration: 11.7 },
  { left: '53%', top: '90%', size: 5, delay: 1.1, duration: 12.9 },
]

export default function Home() {
  const { data: blogsData, isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => blogApi.getBlogs(0, 10),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['popular-tags'],
    queryFn: () => tagApi.getPopular(),
  })

  const blogs = blogsData?.data?.content || []
  const tags = tagsData?.data || []
  const featuredBlog = blogs[0]
  const restBlogs = blogs.slice(1)

  const totalViews = useMemo(() => blogs.reduce((sum, item) => sum + (item.views || 0), 0), [blogs])
  const totalInteractions = useMemo(
    () => blogs.reduce((sum, item) => sum + (item.likesCount || 0) + (item.commentCount || 0), 0),
    [blogs],
  )

  const [parallaxDepth, setParallaxDepth] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const depth = Math.min(42, window.scrollY * 0.07)
      setParallaxDepth(depth)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fade-in home-premium space-y-10 md:space-y-12">
      <section
        className="hero-hitech-grid hero-parallax"
        style={{ '--parallax-offset': `${parallaxDepth}px` } as CSSProperties}
      >
        <div className="hero-grid-overlay" aria-hidden></div>
        <div className="hero-scan-line" aria-hidden></div>

        <div className="hero-particle-field" aria-hidden>
          {HERO_PARTICLES.map((particle, index) => (
            <span
              key={`${particle.left}-${particle.top}-${index}`}
              className="hero-particle"
              style={
                {
                  '--particle-left': particle.left,
                  '--particle-top': particle.top,
                  '--particle-size': `${particle.size}px`,
                  '--particle-delay': `${particle.delay}s`,
                  '--particle-duration': `${particle.duration}s`,
                } as CSSProperties
              }
            ></span>
          ))}
        </div>

        <div className="hero-hitech-content reveal-up hero-depth-1">
          <div className="hero-chip mb-5">
            <FiZap size={14} />
            <span>新一代创作平台</span>
          </div>

          <h1 className="hero-hitech-title hero-glitch" data-text="把内容创作变成沉浸式体验">
            把内容创作变成
            <span className="hero-title-gradient">沉浸式体验</span>
          </h1>

          <p className="hero-hitech-subtitle">
            这里不只是博客，更是一个带有动态叙事、实时反馈和高级视觉节奏的创作空间。
            从灵感捕捉到发布传播，每一步都更流畅、更专业、更有未来感。
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/editor" className="btn btn-primary magnetic-btn">
              <FiZap size={16} />
              开始创作
            </Link>
            <Link to="/search" className="btn btn-secondary">
              <FiCompass size={16} />
              探索内容
            </Link>
          </div>

          <div className="hero-metrics-grid">
            <MetricTile label="总文章" value={`${blogs.length}+`} />
            <MetricTile label="总浏览" value={formatCompact(totalViews)} />
            <MetricTile label="互动量" value={formatCompact(totalInteractions)} />
          </div>

          <div className="hero-energy-track" aria-hidden>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div className="hero-hitech-panel reveal-up hero-depth-2">
          <div className="hero-panel-glow"></div>
          <div className="hero-panel-head">
            <span className="status-dot"></span>
            <span>实时动态</span>
          </div>

          <div className="hero-panel-cards">
            <div className="hero-float-card">
              <p className="text-xs text-slate-500 mb-1">今日热度</p>
              <div className="text-2xl font-bold text-slate-800">+{Math.max(8, blogs.length * 3)}%</div>
              <p className="text-xs text-primary-600 mt-1">内容互动持续上升</p>
            </div>
            <div className="hero-float-card">
              <p className="text-xs text-slate-500 mb-1">标签网络</p>
              <div className="text-lg font-semibold text-slate-800">{tags.length} 个热点标签</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                <FiLayers size={14} />
                <span>多维内容发现</span>
              </div>
            </div>
          </div>

          <div className="hero-tech-badges" aria-hidden>
            <span>智能策展</span>
            <span>动效界面</span>
            <span>内容洞察</span>
          </div>

          <div className="hero-wave-lines" aria-hidden>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
        <div className="xl:col-span-8 space-y-7">
          <section className="premium-section-card reveal-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                <FiTrendingUp className="text-primary-500" />
                趋势精选
              </h2>
              <Link to="/search" className="btn-read-more">
                查看全部 <FiArrowRight />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="skeleton h-28 w-full rounded-2xl"></div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="card text-center py-16">
                <h3 className="text-xl mb-4">还没有文章</h3>
                <p className="text-gray-500 mb-6">成为第一个分享想法的人吧</p>
                <Link to="/editor" className="btn btn-primary">
                  写第一篇文章
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {featuredBlog && <FeaturedStory blog={featuredBlog} />}
                <div className="space-y-6">
                  {restBlogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="xl:col-span-4 space-y-6">
          <section className="premium-side-card reveal-up">
            <h3 className="side-title">热门标签</h3>
            <div className="flex flex-wrap gap-2.5">
              {tags.slice(0, 12).map((tag) => (
                <Link
                  key={tag.id}
                  to={`/search?tag=${tag.id}`}
                  className={tag.isHot ? 'hot-tag' : 'tag'}
                  style={!tag.isHot ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="premium-side-card reveal-up">
            <h3 className="side-title">平台信号</h3>
            <div className="space-y-3">
              <SignalRow title="创作活跃度" value={`${Math.min(98, 56 + blogs.length * 4)}%`} />
              <SignalRow title="发现效率" value={`${Math.min(99, 64 + tags.length * 3)}%`} />
              <SignalRow title="内容质量评分" value="优" />
            </div>
          </section>

          <section className="premium-side-card reveal-up">
            <h3 className="side-title">网站介绍</h3>
            <ul className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <li>• 这里不是“发完就跑”的普通博客，而是你的内容游乐场。</li>
              <li>• 灵感来了就开写，写完就发，发了还能被更多人看见、互动、讨论。</li>
              <li>• 一句话：把“写点东西”这件事，变成一件会上头的事。</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

function FeaturedStory({ blog }: { blog: BlogListItem }) {
  const navigate = useNavigate()
  const defaultImage = `https://picsum.photos/seed/featured-${blog.id}/1200/700`

  const openDetail = () => navigate(`/blog/${blog.id}`)

  const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('a, button, input, textarea, [role="button"]')) return
    openDetail()
  }

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDetail()
    }
  }

  return (
    <article
      className="featured-story-card card-clickable"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="featured-story-image-wrap">
        <img src={blog.image || defaultImage} alt={blog.title} className="featured-story-image" />
        <div className="featured-story-overlay"></div>
        <div className="featured-story-topbar">
          <span className="badge badge-primary">精选</span>
          {blog.isSticky && <span className="badge badge-sticky">置顶</span>}
        </div>
      </div>

      <div className="featured-story-content">
        <div className="text-xs uppercase tracking-[0.2em] text-primary-600 mb-3">编辑精选</div>
        <h3 className="text-2xl md:text-[1.8rem] leading-tight font-serif mb-3 text-slate-800">
          <span className="hover:text-primary-600 transition-colors">{blog.title}</span>
        </h3>
        <p className="text-slate-600 leading-7 line-clamp-2 mb-5">
          {blog.summary || '暂无摘要，点击阅读查看完整内容。'}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Meta icon={<FiEye size={15} />} value={String(blog.views)} />
            <Meta icon={<FiHeart size={15} />} value={String(blog.likesCount)} />
            <Meta icon={<FiMessageCircle size={15} />} value={String(blog.commentCount)} />
            <Meta icon={<FiClock size={15} />} value={`${blog.readTime} 分钟`} />
          </div>
          <span className="btn-read-more">
            阅读更多 <FiArrowRight />
          </span>
        </div>
      </div>
    </article>
  )
}

function BlogCard({ blog }: { blog: BlogListItem }) {
  const navigate = useNavigate()
  const defaultImage = `https://picsum.photos/seed/${blog.id}/800/500`

  const openDetail = () => navigate(`/blog/${blog.id}`)

  const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('a, button, input, textarea, [role="button"]')) return
    openDetail()
  }

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDetail()
    }
  }

  return (
    <article
      className="blog-post-card-2 premium-blog-card card-clickable"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="post-image-box">
        <img src={blog.image || defaultImage} alt={blog.title} className="w-full" />
        {blog.isSticky && <span className="badge badge-sticky absolute top-4 left-4">置顶</span>}
      </div>

      <div className="post-content-box">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={blog.author?.avatar || `https://ui-avatars.com/api/?name=${blog.author?.username}&background=E8B4B8&color=fff`}
            alt={blog.author?.username}
            className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
          />
          <div>
            <Link to={`/user/${blog.author?.username}`} className="font-medium text-gray-800 hover:text-primary-600 transition-colors">
              {blog.author?.username}
            </Link>
            <div className="text-sm text-gray-500">{dayjs(blog.createdAt).fromNow()}</div>
          </div>
        </div>

        <h3 className="blog-post-title">
          <span>{blog.title}</span>
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-2">{blog.summary || '暂无摘要，点击阅读查看详情。'}</p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <Meta icon={<FiEye size={14} />} value={String(blog.views)} />
            <Meta icon={<FiHeart size={14} />} value={String(blog.likesCount)} />
            <Meta icon={<FiMessageCircle size={14} />} value={String(blog.commentCount)} />
            <Meta icon={<FiClock size={14} />} value={`${blog.readTime} 分钟`} />
          </div>

          <span className="btn-read-more">
            阅读更多 <FiArrowRight />
          </span>
        </div>
      </div>
    </article>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="hero-metric-tile">
      <div className="hero-metric-value">{value}</div>
      <div className="hero-metric-label">{label}</div>
    </div>
  )
}

function SignalRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="signal-row">
      <span>{title}</span>
      <span>{value}</span>
    </div>
  )
}

function Meta({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="stat-item">
      {icon}
      {value}
    </span>
  )
}

function formatCompact(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}千`
  }
  return String(value)
}
