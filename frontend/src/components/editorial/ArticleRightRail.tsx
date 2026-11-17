import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiArrowUpRight, FiClock, FiCompass, FiEye, FiFileText, FiTrendingUp } from 'react-icons/fi'
import dayjs from 'dayjs'
import { blogApi } from '@/api/blog'
import TableOfContents from '@/components/TableOfContents'
import EditorialCover from '@/components/editorial/EditorialCover'
import type { Blog, BlogListItem, Tag } from '@/types'

interface TocItem {
  id: string
  text: string
  level: number
}

interface ArticleRightRailProps {
  blog: Blog
  categoryName: string
  toc: TocItem[]
  activeId: string
  readingProgress: number
  onClickHeading: (id: string) => void
  tags: Tag[]
}

export default function ArticleRightRail({
  blog,
  categoryName,
  toc,
  activeId,
  readingProgress,
  onClickHeading,
  tags,
}: ArticleRightRailProps) {
  const { data: recentBlogsData } = useQuery({
    queryKey: ['blogs', null],
    queryFn: () => blogApi.getBlogs(0, 8),
  })

  const recommendedPosts: BlogListItem[] = (recentBlogsData?.data?.content || [])
    .filter((item) => String(item.id) !== String(blog.id))
    .slice(0, 4)

  const plainCharCount = (blog.rawContent || blog.content || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '').length

  return (
    <aside className="hidden lg:block w-[276px] shrink-0">
      <div className="sticky top-24 space-y-5">
        {/* Card 1: Table of Contents (if headings exist) */}
        {toc.length > 0 && (
          <TableOfContents
            toc={toc}
            activeId={activeId}
            progress={readingProgress}
            onClickHeading={onClickHeading}
          />
        )}

        {/* Card 2: Compact Reading Metrics Card */}
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="card p-5 space-y-3.5 hover:transform-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-700 dark:text-ink-200 flex items-center gap-1.5">
              <FiFileText size={13} className="text-vermilion" />
              <span>文章阅读概览</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-vermilion/10 text-vermilion font-editorial-mono text-[10px] font-medium">
              {Math.round(readingProgress)}%
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-paper-200 dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-vermilion transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(4, readingProgress))}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="p-2.5 rounded-2xl bg-paper-200/55 dark:bg-white/[0.04]">
              <p className="text-[10px] text-ink-400">正文字数</p>
              <p className="font-editorial-serif text-base font-bold text-ink-800 dark:text-ink-100 mt-0.5">
                {plainCharCount} 字
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-paper-200/55 dark:bg-white/[0.04]">
              <p className="text-[10px] text-ink-400">预计耗时</p>
              <p className="font-editorial-serif text-base font-bold text-ink-800 dark:text-ink-100 mt-0.5 flex items-center gap-1">
                <FiClock size={12} className="text-vermilion" />
                <span>{blog.readTime || 3} 分钟</span>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-[11px] text-ink-400">
            <span>分类：{categoryName}</span>
            <span className="font-editorial-mono">{dayjs(blog.createdAt).format('YYYY.MM.DD')}</span>
          </div>
        </motion.div>

        {/* Card 3: Recommended / Trending Posts */}
        {recommendedPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="card p-5 space-y-4 hover:transform-none"
          >
            <div className="flex items-center justify-between pb-2 border-b border-hairline-light dark:border-hairline-dark">
              <h3 className="text-xs font-semibold text-ink-700 dark:text-ink-200 flex items-center gap-1.5">
                <FiTrendingUp size={13} className="text-vermilion" />
                <span>推荐继续阅读</span>
              </h3>
              <Link
                to="/search"
                className="text-[11px] text-ink-400 hover:text-vermilion inline-flex items-center gap-0.5 transition-colors"
              >
                <span>更多</span>
                <FiArrowUpRight size={12} />
              </Link>
            </div>

            <div className="space-y-3.5">
              {recommendedPosts.map((item, idx) => (
                <Link
                  key={item.id}
                  to={`/blog/${item.id}`}
                  className="group flex items-center gap-3"
                >
                  <div className="w-16 shrink-0 relative">
                    <EditorialCover
                      src={item.image}
                      title={item.title}
                      seed={item.id}
                      aspectClass="aspect-[4/3]"
                      roundedClass="rounded-xl"
                      compact
                      curtainReveal={false}
                    />
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-ink-900 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-editorial-mono text-[10px] font-bold flex items-center justify-center shadow">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="font-editorial-serif text-sm font-bold text-ink-800 dark:text-ink-100 line-clamp-2 leading-snug group-hover:text-vermilion transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-ink-400">
                      <span className="truncate max-w-[90px]">{item.author?.username}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5 shrink-0">
                        <FiEye size={11} /> {item.views || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Card 4: Topic Tags Cloud */}
        {tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="card p-5 space-y-3.5 hover:transform-none"
          >
            <div className="flex items-center justify-between pb-2 border-b border-hairline-light dark:border-hairline-dark">
              <h3 className="text-xs font-semibold text-ink-700 dark:text-ink-200 flex items-center gap-1.5">
                <FiCompass size={13} className="text-vermilion" />
                <span>热门话题标签</span>
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 12).map((tag) => (
                <Link
                  key={tag.id}
                  to={`/tag/${tag.id}`}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-paper-200/65 dark:bg-white/[0.05] border border-hairline-light dark:border-hairline-dark text-ink-600 dark:text-ink-300 hover:border-vermilion hover:text-vermilion transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </aside>
  )
}
