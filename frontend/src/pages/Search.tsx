import { useEffect, useState } from 'react'
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiSearch, FiEye, FiHeart, FiMessageCircle } from 'react-icons/fi'
import { blogApi } from '@/api/blog'
import { tagApi, categoryApi } from '@/api/category'
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

  useEffect(() => {
    setSearchInput(keyword)
  }, [keyword])

  // Search blogs
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['search', keyword, tagId, categoryId],
    queryFn: () => {
      if (tagId) {
        return blogApi.getBlogsByTag(tagId, 0, 20)
      }
      if (categoryId) {
        return blogApi.getBlogsByCategory(categoryId, 0, 20)
      }
      if (keyword) {
        return blogApi.searchBlogs(keyword, 0, 20)
      }
      return blogApi.getBlogs(0, 20)
    },
  })

  // Fetch all tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagApi.getAll(),
  })

  // Fetch all categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  })

  const blogs = searchData?.data?.content || []
  const tags = tagsData?.data || []
  const categories = categoriesData?.data || []

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

  const activeTag = tagId ? tags.find((t: Tag) => t.id === tagId) : null
  const activeCategory = categoryId
    ? categories.find((c: Category) => c.id === categoryId)
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-3">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FiSearch size={20} />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索文章..."
              className="input pl-12 pr-24 text-lg"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary btn-sm">
              搜索
            </button>
          </div>
        </form>

        {/* Active Filters */}
        {(keyword || activeTag || activeCategory) && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-gray-600">当前筛选:</span>
            {keyword && (
              <span className="px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-sm">
                关键词: {keyword}
              </span>
            )}
            {activeTag && (
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: activeTag.color + '20', color: activeTag.color }}
              >
                标签：{activeTag.name}
              </span>
            )}
            {activeCategory && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                分类: {activeCategory.name}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 ml-2"
            >
              清除筛选
            </button>
          </div>
        )}

        {/* Results */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {keyword
            ? `"${keyword}" 的搜索结果`
            : activeTag
            ? `标签：${activeTag.name}`
            : activeCategory
            ? `分类: ${activeCategory.name}`
            : '发现文章'}
          <span className="text-gray-500 font-normal text-base ml-2">
            ({blogs.length} 篇)
          </span>
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">没有找到相关文章</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog: BlogListItem) => (
              <article key={blog.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={
                          blog.author?.avatar ||
                          `https://ui-avatars.com/api/?name=${blog.author?.username}`
                        }
                        alt={blog.author?.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <Link
                        to={`/user/${blog.author?.username}`}
                        className="text-sm text-gray-600 hover:text-primary-600"
                      >
                        {blog.author?.username}
                      </Link>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-500">
                        {dayjs(blog.createdAt).fromNow()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-primary-600">
                      <Link to={`/blog/${blog.id}`}>{blog.title}</Link>
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {blog.summary}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiEye size={14} />
                        {blog.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiHeart size={14} />
                        {blog.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiMessageCircle size={14} />
                        {blog.commentCount}
                      </span>
                    </div>
                  </div>

                  {blog.image && (
                    <div className="hidden sm:block w-32 h-24 flex-shrink-0">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-1 space-y-6">
        {/* Categories */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">分类</h3>
          <ul className="space-y-2">
            {categories.map((category: Category) => (
              <li key={category.id}>
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    categoryId === category.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 标签 */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">标签</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: Tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  tagId === tag.id
                    ? 'ring-2 ring-offset-1'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                  ...(tagId === tag.id ? { ringColor: tag.color } : {}),
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
