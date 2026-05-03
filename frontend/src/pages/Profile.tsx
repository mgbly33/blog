import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiEdit2, FiCalendar, FiHeart, FiEye, FiSettings, FiUsers, FiClock } from 'react-icons/fi'
import { userApi } from '@/api/user'
import { blogApi } from '@/api/blog'
import { useAuthStore } from '@/stores/authStore'
import StatsBar from '@/components/profile/StatsBar'
import StateCard from '@/components/ui/StateCard'
import type { BlogListItem } from '@/types'
import { REVIEW_STATUS_META } from '@/constants/reviewStatus'
import dayjs from 'dayjs'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'bookmarks'>('posts')
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState('')

  const isOwnProfile = currentUser?.username === username

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => userApi.getUserByUsername(username!),
    enabled: !!username,
  })

  const { data: blogsData, isLoading: blogsLoading } = useQuery({
    queryKey: ['user-blogs', username],
    queryFn: () => blogApi.getUserBlogs(username!, 0, 20),
    enabled: !!username && activeTab === 'posts',
  })

  const { data: likedData, isLoading: likedLoading } = useQuery({
    queryKey: ['user-likes', username],
    queryFn: () => blogApi.getLikedBlogs(0, 20),
    enabled: !!username && activeTab === 'likes' && isOwnProfile,
  })

  const { data: bookmarkedData, isLoading: bookmarkedLoading } = useQuery({
    queryKey: ['user-bookmarks', username],
    queryFn: () => blogApi.getBookmarkedBlogs(0, 20),
    enabled: !!username && activeTab === 'bookmarks' && isOwnProfile,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (newBio: string) => userApi.updateProfile({ bio: newBio }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] })
      setIsEditing(false)
      toast.success('简介已更新')
    },
    onError: () => {
      toast.error('更新失败')
    },
  })

  const handleSaveBio = () => {
    updateProfileMutation.mutate(bio)
  }

  if (userLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const profile = userData?.data
  const blogs = blogsData?.data?.content || []
  const likedBlogs = likedData?.data?.content || []
  const bookmarkedBlogs = bookmarkedData?.data?.content || []

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <StateCard type="empty" title="用户不存在" actionText="返回首页" actionTo="/" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative mb-6">
        <div className="absolute inset-0 h-48 rounded-t-2xl bg-gradient-to-br from-primary-400 via-secondary-300 to-accent-gold opacity-80"></div>

        <div className="relative card pt-32 pb-6">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0">
            <img
              src={
                profile.avatar ||
                `https://ui-avatars.com/api/?name=${profile.username}&size=128&background=E8B4B8&color=fff`
              }
              alt={profile.username}
              className="w-32 h-32 rounded-full ring-4 ring-white shadow-lg object-cover"
            />
          </div>

          {isOwnProfile && (
            <button
              onClick={() => navigate('/settings')}
              className="absolute top-4 right-4 btn btn-secondary btn-sm"
            >
              <FiSettings size={16} />
              <span className="hidden sm:inline">设置</span>
            </button>
          )}

          <div className="text-center sm:text-left sm:pl-40">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">{profile.username}</h1>
              {Boolean(profile.isAdmin || profile.role === 'ADMIN') && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
                  管理员
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 max-w-md">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="写点个人简介，让大家更了解你..."
                  className="input min-h-[80px] resize-none text-sm"
                  maxLength={500}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveBio}
                    disabled={updateProfileMutation.isPending}
                    className="btn btn-primary btn-sm"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-gray-600 mb-4 max-w-md">
                  {profile.bio || '这个人很懒，还没有填写个人简介。'}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setBio(profile.bio || '')
                      setIsEditing(true)
                    }}
                    className="text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    <FiEdit2 size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FiCalendar size={14} />
                加入时间 {dayjs(profile.createdAt).format('YYYY-MM-DD')}
              </span>
              <span className="flex items-center gap-1">
                <FiUsers size={14} />
                {profile.followerCount || 0} 粉丝
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <StatsBar
          blogCount={profile.blogCount || 0}
          receivedLikeCount={profile.receivedLikeCount || profile.likeCount || 0}
          likedCount={profile.likedCount || 0}
          bookmarkCount={profile.bookmarksCount || profile.bookmarkCount || 0}
          followerCount={profile.followerCount || 0}
        />
      </div>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === 'posts'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          文章
        </button>
        {isOwnProfile && (
          <>
            <button
              onClick={() => setActiveTab('likes')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'likes'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              我点赞 ({profile.likedCount || likedBlogs.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'bookmarks'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              收藏
            </button>
          </>
        )}
      </div>

      {activeTab === 'posts' && (
        <div>
          {blogsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <StateCard
              type="empty"
              title="还没有发布文章"
              actionText={isOwnProfile ? '去写第一篇文章' : undefined}
              actionTo={isOwnProfile ? '/editor' : undefined}
            />
          ) : (
            <div className="space-y-4">
              {blogs.map((blog: BlogListItem) => (
                <BlogCard key={blog.id} blog={blog} showStatus={isOwnProfile} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'likes' && isOwnProfile && (
        <div>
          {likedLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : likedBlogs.length === 0 ? (
            <StateCard type="empty" title="你还没有点赞过文章" />
          ) : (
            <div className="space-y-4">
              {likedBlogs.map((blog: BlogListItem) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookmarks' && isOwnProfile && (
        <div>
          {bookmarkedLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : bookmarkedBlogs.length === 0 ? (
            <StateCard type="empty" title="你还没有收藏文章" />
          ) : (
            <div className="space-y-4">
              {bookmarkedBlogs.map((blog: BlogListItem) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BlogCard({ blog, showStatus = false }: { blog: BlogListItem; showStatus?: boolean }) {
  const statusMeta = REVIEW_STATUS_META[blog.status as keyof typeof REVIEW_STATUS_META]

  return (
    <article className="card hover:shadow-lg transition-shadow">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800 hover:text-primary-600">
          <Link to={`/blog/${blog.id}`}>{blog.title}</Link>
        </h3>
        {showStatus && statusMeta && (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta.badgeClass}`}>
            {statusMeta.label}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{blog.summary}</p>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <FiEye size={14} />
          {blog.views}
        </span>
        <span className="flex items-center gap-1">
          <FiHeart size={14} />
          {blog.likesCount}
        </span>
        <span>{dayjs(blog.createdAt).format('YYYY-MM-DD')}</span>
        {showStatus && blog.status === 'SCHEDULED' && blog.publishAt && (
          <span className="inline-flex items-center gap-1 text-blue-600">
            <FiClock size={13} />
            {dayjs(blog.publishAt).format('MM-DD HH:mm')} 定时发布
          </span>
        )}
      </div>
    </article>
  )
}
