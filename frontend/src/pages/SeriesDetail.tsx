import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiArrowLeft, FiArrowUpRight, FiCheckCircle } from 'react-icons/fi'
import dayjs from 'dayjs'
import { seriesApi } from '@/api/series'
import StateCard from '@/components/ui/StateCard'
import EditorialCover from '@/components/editorial/EditorialCover'
import type { BlogListItem } from '@/types'

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['series', id],
    queryFn: () => seriesApi.getSeriesById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <StateCard type="loading" title="正在加载专栏章节..." />
  }

  const series = data?.data
  if (!series) {
    return <StateCard type="empty" title="该系列专栏不存在" actionText="返回系列专栏" actionTo="/series" />
  }

  const posts = series.posts || []

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <Link
        to="/series"
        className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-vermilion transition-colors"
      >
        <FiArrowLeft size={13} />
        <span>返回全部专栏</span>
      </Link>

      <header className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-hairline-light dark:border-hairline-dark items-center">
        <div className="md:col-span-5">
          <EditorialCover
            src={series.coverUrl}
            title={series.title}
            seed={series.id}
            badgeText={`系列专栏 · ${posts.length} 篇`}
            aspectClass="aspect-[4/3]"
          />
        </div>

        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="badge badge-vermilion">专题连载</span>
            <span className="text-ink-500 flex items-center gap-1">
              {series.status === 'Completed' && <FiCheckCircle size={12} className="text-vermilion" />}
              {series.status === 'Completed' ? '已完结' : '连载更新中'}
            </span>
          </div>

          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-50 leading-tight">
            {series.title}
          </h1>

          {series.description && (
            <p className="editorial-lead text-base text-ink-600 dark:text-ink-300">
              {series.description}
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-ink-400">
            <Link
              to={`/user/${series.author?.username}`}
              className="text-ink-800 dark:text-ink-200 font-semibold hover:text-vermilion"
            >
              作者：{series.author?.username}
            </Link>
            <span>·</span>
            <span>共 {posts.length} 篇文章</span>
            <span>·</span>
            <span>更新于 {dayjs(series.updatedAt).format('YYYY-MM-DD')}</span>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-500">
            章节目录
          </h2>
          {posts.length > 0 && (
            <span className="font-editorial-mono text-[11px] text-ink-400">
              01 — {String(posts.length).padStart(2, '0')}
            </span>
          )}
        </div>

        {posts.length === 0 ? (
          <StateCard type="empty" title="该专栏暂未收录已发布的公开文章" />
        ) : (
          <div className="divide-y divide-hairline-light dark:divide-hairline-dark border-y border-hairline-light dark:border-hairline-dark">
            {posts.map((post: BlogListItem, index: number) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                data-cursor="阅读全文"
                className="group py-5 px-4 -mx-4 rounded-2xl flex items-baseline gap-4 hover:bg-paper-200/65 dark:hover:bg-ink-800/65 transition-colors"
              >
                <span className="font-editorial-serif italic font-bold text-2xl text-ink-300 dark:text-ink-600 group-hover:text-vermilion transition-colors w-10 shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-editorial-serif font-bold text-lg sm:text-xl text-ink-900 dark:text-ink-50 group-hover:text-vermilion transition-colors truncate">
                      {post.title}
                    </h3>
                    <div className="hidden sm:block flex-1 toc-dots h-3 opacity-60" />
                    <span className="text-xs text-ink-400 shrink-0 flex items-center gap-1">
                      <span>约 {post.readTime || 3} 分钟</span>
                      <FiArrowUpRight size={13} className="group-hover:text-vermilion" />
                    </span>
                  </div>
                  {post.summary && (
                    <p className="text-xs text-ink-500 dark:text-ink-400 line-clamp-1 mt-1">
                      {post.summary}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
