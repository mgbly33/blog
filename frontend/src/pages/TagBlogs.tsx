import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiTag, FiCalendar, FiEye, FiHeart, FiMessageCircle } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { blogApi } from '@/api/blog'
import { tagApi } from '@/api/category'
import type { BlogListItem, Tag } from '@/types'

export default function TagBlogs() {
  const { tagId } = useParams<{ tagId: string }>()
  const [page, setPage] = useState(0)

  const { data: tagData } = useQuery({
    queryKey: ['tag', tagId],
    queryFn: () => tagApi.getById(tagId!),
    enabled: !!tagId,
  })

  const { data: blogsData, isLoading, error } = useQuery({
    queryKey: ['tagBlogs', tagId, page],
    queryFn: () => blogApi.getBlogsByTag(tagId!, page, 10),
    enabled: !!tagId,
  })

  const tag = tagData?.data as Tag | undefined
  const blogs = blogsData?.data?.content || []
  const pageInfo = blogsData?.data

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-100 h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-red-500">加载失败，请稍后重试</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: tag?.color || '#6366f1' }}
          >
            <FiTag className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {tag?.name || '标签'}
            </h1>
            {tag?.description && (
              <p className="text-gray-500 text-sm">{tag.description}</p>
            )}
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          共 {pageInfo?.totalElements || 0} 篇文章
        </p>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12">
          <FiTag size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">该标签下暂无文章</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog: BlogListItem) => (
            <Link
              key={blog.id}
              to={`/blog/${blog.id}`}
              className="card block hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-4">
                {blog.image && (
                  <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-800 hover:text-primary-600 line-clamp-1">
                    {blog.title}
                  </h2>
                  {blog.summary && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {blog.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiCalendar size={14} />
                      {formatDistanceToNow(new Date(blog.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
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
              </div>
            </Link>
          ))}
        </div>
      )}

      {pageInfo && pageInfo.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-secondary"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-gray-600">
            {page + 1} / {pageInfo.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pageInfo.hasNext}
            className="btn btn-secondary"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
