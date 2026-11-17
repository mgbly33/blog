import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiSearch, FiEye, FiHeart, FiMessageCircle, FiX, FiArrowUpRight } from 'react-icons/fi'
import { blogApi } from '@/api/blog'
import { tagApi, categoryApi } from '@/api/category'
import EditorialCover from '@/components/editorial/EditorialCover'
import type { BlogListItem, Tag, Category } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default function Search() {
  const navigate = useNavigate()
  const { categoryId: routeCategoryId } = useParams<{ categoryId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('q') || ''
  const tagId = searchParams.get('tag')
  const categoryId = searchParams.get('category') || routeCategoryId || null
  const [searchInput, setSearchInput] = useState(keyword)
  const [page, setPage] = useState(0)

  useEffect(() => {
    setSearchInput(keyword)
    setPage(0)
  }, [keyword, tagId, categoryId])

  const { data: searchData, isLoading } = useQuery({
    queryKey: ['search', keyword, tagId, categoryId, page],
    queryFn: () => {
      if (tagId) return blogApi.getBlogsByTag(tagId, page, 12)
      if (categoryId) return blogApi.getBlogsByCategory(categoryId, page, 12)
      if (keyword) return blogApi.searchBlogs(keyword, page, 12)
      return blogApi.getBlogs(page, 12)
    },
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagApi.getAll(),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  })

  const pageData = searchData?.data
  const blogs = pageData?.content || []
  const totalElements = pageData?.totalElements ?? blogs.length
  const tags = tagsData?.data || []
  const categories = categoriesData?.data || []

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories) {
      map.set(String(c.id), c.name)
    }
    return map
  }, [categories])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    } else {
      navigate('/search')
    }
  }

  const handleTagClick = (id: string) => {
    navigate(`/search?tag=${encodeURIComponent(id)}`)
  }

  const handleCategoryClick = (id: string) => {
    navigate(`/category/${encodeURIComponent(id)}`)
  }

  const clearFilters = () => {
    setSearchParams({})
    setSearchInput('')
    navigate('/search')
  }

  const activeTag = tagId ? tags.find((t: Tag) => String(t.id) === String(tagId)) : null
  const activeCategory = categoryId
    ? categories.find((c: Category) => String(c.id) === String(categoryId))
    : null

  const headingTitle = keyword
    ? `“${keyword}” 的搜索结果`
    : activeTag
      ? `标签归档 · #${activeTag.name}`
      : activeCategory
        ? `文章分类 · ${activeCategory.name}`
        : '发现与搜索文章'

  return (
    <div className="space-y-10">
      <header className="border-b border-hairline-light dark:border-hairline-dark pb-8 space-y-5">
        <div className="flex items-center justify-between text-[11px] font-editorial-mono uppercase tracking-[0.2em] text-ink-400">
          <span className="text-vermilion font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-vermilion" />
            DISCOVER & SEARCH
          </span>
          <span>共 {totalElements} 篇文章</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7">
            <h1 className="font-editorial-serif text-3xl sm:text-5xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">
              {headingTitle}
            </h1>
          </div>

          <form onSubmit={handleSearch} className="lg:col-span-5">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={17} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="输入关键词搜索标题或正文..."
                className="input pl-10 pr-24 py-3"
              />
              <button type="submit" className="btn btn-primary btn-sm absolute right-1.5 top-1/2 -translate-y-1/2">
                搜索
              </button>
            </div>
          </form>
        </div>

        {(keyword || activeTag || activeCategory) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-ink-400">当前筛选：</span>
            {keyword && <span className="badge badge-primary">关键词：{keyword}</span>}
            {activeTag && <span className="badge badge-vermilion">标签：#{activeTag.name}</span>}
            {activeCategory && <span className="badge badge-primary">分类：{activeCategory.name}</span>}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-vermilion ml-2"
            >
              <FiX size={13} />
              <span>清除筛选</span>
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Catalogue List (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-paper-200 dark:bg-ink-800" />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="card p-14 text-center space-y-3 hover:transform-none">
              <p className="font-editorial-serif text-2xl text-ink-700 dark:text-ink-200">
                未找到匹配的博客文章
              </p>
              <p className="text-xs text-ink-400">可尝试更换关键词或清除当前筛选条件</p>
              {(keyword || activeTag || activeCategory) && (
                <button type="button" onClick={clearFilters} className="btn btn-secondary btn-sm mt-2">
                  重置筛选条件
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-hairline-light dark:divide-hairline-dark border-b border-hairline-light dark:border-hairline-dark">
                {blogs.map((blog: BlogListItem) => {
                  const catName =
                    blog.category ||
                    (blog.categoryId ? categoryMap.get(String(blog.categoryId)) : null) ||
                    '博客文章'
                  return (
                    <article
                      key={blog.id}
                      className="group py-6 first:pt-0 flex flex-col sm:flex-row gap-6 items-start justify-between"
                    >
                      <div className="flex-1 min-w-0 space-y-2.5">
                        <div className="flex items-center gap-2.5 text-xs text-ink-400">
                          <span className="text-vermilion font-medium">{catName}</span>
                          <span>·</span>
                          <span>{dayjs(blog.createdAt).format('YYYY-MM-DD')}</span>
                          <span>·</span>
                          <span>约 {blog.readTime || 3} 分钟阅读</span>
                        </div>

                        <Link to={`/blog/${blog.id}`} className="block" data-cursor="阅读全文">
                          <h2 className="font-editorial-serif text-2xl font-bold text-ink-900 dark:text-ink-50 leading-snug">
                            <span className="editorial-link">{blog.title}</span>
                          </h2>
                        </Link>

                        {blog.summary && (
                          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 line-clamp-2 leading-relaxed">
                            {blog.summary}
                          </p>
                        )}

                        <div className="pt-1 flex items-center justify-between text-xs text-ink-400">
                          <Link
                            to={`/user/${blog.author?.username}`}
                            className="font-medium text-ink-700 dark:text-ink-300 hover:text-vermilion"
                          >
                            {blog.author?.username}
                          </Link>
                          <div className="flex items-center gap-4">
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
                      </div>

                      <Link
                        to={`/blog/${blog.id}`}
                        className="w-full sm:w-44 shrink-0"
                      >
                        <EditorialCover
                          src={blog.image}
                          title={blog.title}
                          seed={blog.id}
                          aspectClass="aspect-[16/10]"
                          compact
                          cursorLabel="阅读全文"
                        />
                      </Link>
                    </article>
                  )
                })}
              </div>

              {pageData && pageData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-ink-400">
                    第 {page + 1} / {pageData.totalPages} 页
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={!pageData.hasPrevious}
                      className="btn btn-secondary btn-sm"
                    >
                      上一页
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pageData.hasNext}
                      className="btn btn-secondary btn-sm"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar: Categories & Tags (4 Cols) */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
          {categories.length > 0 && (
            <div className="card space-y-3 hover:transform-none">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500 pb-2 border-b border-hairline-light dark:border-hairline-dark">
                文章分类
              </h3>
              <div className="space-y-1">
                {categories.map((cat: Category) => {
                  const isActive = String(categoryId) === String(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                        isActive
                          ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-medium'
                          : 'text-ink-600 dark:text-ink-300 hover:bg-paper-200/70 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="opacity-70 flex items-center gap-1">
                        <span>{cat.blogCount || 0}</span>
                        <FiArrowUpRight size={12} />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="card space-y-3 hover:transform-none">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500 pb-2 border-b border-hairline-light dark:border-hairline-dark">
                全部话题标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: Tag) => {
                  const isActive = String(tagId) === String(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagClick(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        isActive
                          ? 'bg-vermilion text-white border-vermilion'
                          : 'bg-paper-100/70 dark:bg-white/[0.05] border-hairline-light dark:border-hairline-dark text-ink-600 dark:text-ink-300 hover:border-vermilion'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
