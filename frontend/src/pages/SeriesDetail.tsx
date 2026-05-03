import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiBook, FiEye, FiHeart, FiMessageCircle, FiClock, FiCheckCircle, FiChevronRight } from 'react-icons/fi'
import dayjs from 'dayjs'
import { seriesApi } from '@/api/series'
import type { BlogListItem } from '@/types'

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['series', id],
    queryFn: () => seriesApi.getSeriesById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const series = data?.data
  if (!series) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">专栏不存在</p>
          <Link to="/" className="btn btn-primary mt-4 inline-block">返回首页</Link>
        </div>
      </div>
    )
  }

  const posts = series.posts || []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Series Header */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          {series.coverUrl ? (
            <img
              src={series.coverUrl}
              alt={series.title}
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0">
              <FiBook size={32} className="text-primary-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">{series.title}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  series.status === 'Completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {series.status === 'Completed' ? (
                  <>
                    <FiCheckCircle size={10} />
                    已完结
                  </>
                ) : (
                  '连载中'
                )}
              </span>
            </div>
            {series.description && (
              <p className="text-gray-500 mb-3">{series.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <Link
                to={`/user/${series.author?.username}`}
                className="flex items-center gap-1 hover:text-primary-600"
              >
                <img
                  src={series.author?.avatar || `https://ui-avatars.com/api/?name=${series.author?.username}`}
                  alt={series.author?.username}
                  className="w-5 h-5 rounded-full"
                />
                {series.author?.username}
              </Link>
              <span>{posts.length} 篇文章</span>
              <span>更新于 {dayjs(series.updatedAt).format('YYYY-MM-DD')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">目录</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无文章</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post: BlogListItem, index: number) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-lg font-bold text-gray-300 w-8 text-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors truncate">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="text-sm text-gray-400 truncate mt-1">{post.summary}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiEye size={12} />
                      {post.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiHeart size={12} />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMessageCircle size={12} />
                      {post.commentCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock size={12} />
                      {post.readTime}分钟
                    </span>
                  </div>
                </div>
                <FiChevronRight size={18} className="text-gray-300 group-hover:text-primary-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
