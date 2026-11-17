import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiEye, FiHeart, FiMessageCircle, FiArrowLeft } from 'react-icons/fi'
import dayjs from 'dayjs'
import { blogApi } from '@/api/blog'
import { categoryApi, tagApi } from '@/api/category'
import EditorialCover from '@/components/editorial/EditorialCover'
import StateCard from '@/components/ui/StateCard'
import type { BlogListItem, Category, Tag } from '@/types'

export default function TagBlogs() {
  const { tagId } = useParams<{ tagId: string }>()
  const [page, setPage] = useState(0)

  const { data: tagData } = useQuery({
    queryKey: ['tag', tagId],
    queryFn: () => tagApi.getById(tagId!),
    enabled: !!tagId,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  })

  const { data: blogsData, isLoading, error } = useQuery({
    queryKey: ['tagBlogs', tagId, page],
    queryFn: () => blogApi.getBlogsByTag(tagId!, page, 10),
    enabled: !!tagId,
  })

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of (categoriesData?.data || []) as Category[]) {
      map.set(String(c.id), c.name)
    }
    return map
  }, [categoriesData])

  const tag = tagData?.data as Tag | undefined
  const blogs = blogsData?.data?.content || []
  const pageInfo = blogsData?.data

  if (isLoading) {
    return <StateCard type="loading" title="正在加载标签文章..." />
  }

  if (error) {
    return <StateCard type="error" title="无法载入该标签文章" actionText="返回首页" actionTo="/" />
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="border-b border-hairline-light dark:border-hairline-dark pb-8 space-y-3">
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-vermilion transition-colors"
        >
          <FiArrowLeft size={13} />
          <span>返回全部文章</span>
        </Link>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="text-[10px] font-editorial-mono uppercase tracking-[0.22em] text-vermilion font-semibold">
              TOPIC TAG
            </p>
            <h1 className="font-editorial-serif text-4xl sm:text-5xl font-bold text-ink-900 dark:text-ink-50 mt-1">
              #{tag?.name || tagId}
            </h1>
          </div>
          <span className="text-xs text-ink-400">
            共 {pageInfo?.totalElements || blogs.length} 篇文章
          </span>
        </div>

        {tag?.description && (
          <p className="editorial-lead text-base text-ink-600 dark:text-ink-300 max-w-2xl">
            {tag.description}
          </p>
        )}
      </header>

      {blogs.length === 0 ? (
        <StateCard type="empty" title="该标签下暂无已发布文章" actionText="浏览全站文章" actionTo="/search" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {blogs.map((blog: BlogListItem) => {
            const catLabel =
              blog.category ||
              (blog.categoryId ? categoryMap.get(String(blog.categoryId)) : null) ||
              `#${tag?.name || tagId}`
            return (
              <article key={blog.id} className="card p-0 overflow-hidden flex flex-col justify-between group">
                <div>
                  <Link to={`/blog/${blog.id}`} className="block">
                    <EditorialCover
                      src={blog.image}
                      title={blog.title}
                      seed={blog.id}
                      category={catLabel}
                      aspectClass="aspect-[16/10]"
                      roundedClass="rounded-none"
                      className="border-0 border-b"
                      cursorLabel="阅读全文"
                    />
                  </Link>
                  <div className="p-5 space-y-2.5">
                    <div className="text-xs text-ink-400">
                      {dayjs(blog.createdAt).format('YYYY-MM-DD')} · 约 {blog.readTime || 3} 分钟阅读
                    </div>
                    <Link to={`/blog/${blog.id}`} className="block">
                      <h2 className="font-editorial-serif text-xl font-bold text-ink-900 dark:text-ink-50 leading-snug line-clamp-2">
                        <span className="editorial-link">{blog.title}</span>
                      </h2>
                    </Link>
                    {blog.summary && (
                      <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 line-clamp-2">
                        {blog.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs text-ink-400">
                  <span className="text-ink-700 dark:text-ink-300 font-medium">
                    {blog.author?.username}
                  </span>
                  <div className="flex items-center gap-3">
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
              </article>
            )
          })}
        </div>
      )}

      {pageInfo && pageInfo.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4 text-xs">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!pageInfo.hasPrevious}
            className="btn btn-secondary btn-sm"
          >
            上一页
          </button>
          <span className="text-ink-500">
            第 {page + 1} / {pageInfo.totalPages} 页
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pageInfo.hasNext}
            className="btn btn-secondary btn-sm"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
