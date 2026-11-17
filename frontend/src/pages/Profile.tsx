import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FiEdit2,
  FiCalendar,
  FiHeart,
  FiEye,
  FiSettings,
  FiClock,
  FiUserPlus,
  FiUserCheck,
  FiMail,
} from 'react-icons/fi'
import { userApi } from '@/api/user'
import { blogApi } from '@/api/blog'
import { useAuthStore } from '@/stores/authStore'
import StatsBar from '@/components/profile/StatsBar'
import StateCard from '@/components/ui/StateCard'
import EditorialCover from '@/components/editorial/EditorialCover'
import type { BlogListItem } from '@/types'
import { REVIEW_STATUS_META } from '@/constants/reviewStatus'
import dayjs from 'dayjs'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated, setUser } = useAuthStore()
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
    onSuccess: (res) => {
      if (isOwnProfile && res.data) {
        setUser(res.data)
      }
      queryClient.invalidateQueries({ queryKey: ['user', username] })
      setIsEditing(false)
      toast.success('个人简介已更新')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || '更新失败'),
  })

  const followMutation = useMutation({
    mutationFn: (userId: string) => userApi.toggleFollow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] })
      toast.success('关注状态已更新')
    },
    onError: () => toast.error('操作失败'),
  })

  if (userLoading) {
    return <StateCard type="loading" title="正在加载作者主页..." />
  }

  const profile = userData?.data
  const blogs = blogsData?.data?.content || []
  const likedBlogs = likedData?.data?.content || []
  const bookmarkedBlogs = bookmarkedData?.data?.content || []

  if (!profile) {
    return <StateCard type="empty" title="未找到该用户主页" actionText="返回博客首页" actionTo="/" />
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="card p-7 sm:p-10 hover:transform-none">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img
              src={
                profile.avatar ||
                `https://ui-avatars.com/api/?name=${profile.username}&size=160&background=9E6B52&color=FAF8F4`
              }
              alt={profile.username}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-2 ring-white dark:ring-white/10 object-cover shrink-0"
            />

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-editorial-mono uppercase tracking-[0.2em] text-vermilion font-semibold">
                  AUTHOR PROFILE
                </span>
                {Boolean(profile.isAdmin || profile.role === 'ADMIN') && (
                  <span className="badge badge-vermilion">管理员</span>
                )}
              </div>

              <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-50">
                {profile.username}
              </h1>

              {isEditing ? (
                <div className="space-y-2 pt-1 max-w-lg">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="介绍一下你的技术方向或写作兴趣（最多 200 字）..."
                    className="input min-h-[80px] text-sm"
                    maxLength={200}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-editorial-mono text-ink-400">
                      {bio.length} / 200
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProfileMutation.mutate(bio)}
                        disabled={updateProfileMutation.isPending}
                        className="btn btn-primary btn-sm"
                      >
                        保存简介
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 max-w-xl">
                  <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
                    {profile.bio || '这位博主很低调，还没有填写个人简介。'}
                  </p>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setBio(profile.bio || '')
                        setIsEditing(true)
                      }}
                      className="p-1 text-ink-400 hover:text-vermilion shrink-0"
                      title="编辑个人简介"
                    >
                      <FiEdit2 size={13} />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-ink-400 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <FiCalendar size={12} />
                  <span>加入于 {dayjs(profile.createdAt).format('YYYY年MM月')}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start">
            {isOwnProfile ? (
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="btn btn-secondary btn-sm"
              >
                <FiSettings size={13} />
                <span>账号设置</span>
              </button>
            ) : (
              isAuthenticated && (
                <>
                  <button
                    type="button"
                    onClick={() => followMutation.mutate(profile.id)}
                    disabled={followMutation.isPending}
                    className={
                      profile.isFollowing ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'
                    }
                  >
                    {profile.isFollowing ? <FiUserCheck size={13} /> : <FiUserPlus size={13} />}
                    <span>{profile.isFollowing ? '已关注' : '关注作者'}</span>
                  </button>
                  <Link
                    to={`/messages?to=${profile.id}`}
                    className="btn btn-secondary btn-sm"
                    title="发送私信"
                  >
                    <FiMail size={13} />
                    <span>发私信</span>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      <StatsBar
        blogCount={profile.blogCount || blogs.length || 0}
        receivedLikeCount={profile.receivedLikeCount || profile.likeCount || 0}
        likedCount={profile.likedCount || 0}
        bookmarkCount={profile.bookmarksCount || profile.bookmarkCount || 0}
        followerCount={profile.followerCount || 0}
      />

      <div className="border-b border-hairline-light dark:border-hairline-dark flex items-center gap-8 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'posts'
              ? 'border-vermilion text-ink-900 dark:text-ink-50 font-semibold'
              : 'border-transparent text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
          }`}
        >
          发布的文章
        </button>
        {isOwnProfile && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('likes')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'likes'
                  ? 'border-vermilion text-ink-900 dark:text-ink-50 font-semibold'
                  : 'border-transparent text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
              }`}
            >
              点赞的文章
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bookmarks')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'bookmarks'
                  ? 'border-vermilion text-ink-900 dark:text-ink-50 font-semibold'
                  : 'border-transparent text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
              }`}
            >
              收藏夹
            </button>
          </>
        )}
      </div>

      {activeTab === 'posts' && (
        <div>
          {blogsLoading ? (
            <StateCard type="loading" title="正在加载文章列表..." />
          ) : blogs.length === 0 ? (
            <StateCard
              type="empty"
              title="尚未发布公开文章"
              actionText={isOwnProfile ? '写第一篇文章' : undefined}
              actionTo={isOwnProfile ? '/editor' : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {blogs.map((blog: BlogListItem) => (
                <FolioBlogCard key={blog.id} blog={blog} showStatus={isOwnProfile} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'likes' && isOwnProfile && (
        <div>
          {likedLoading ? (
            <StateCard type="loading" title="正在加载点赞文章..." />
          ) : likedBlogs.length === 0 ? (
            <StateCard type="empty" title="还没有点赞过文章" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {likedBlogs.map((blog: BlogListItem) => (
                <FolioBlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookmarks' && isOwnProfile && (
        <div>
          {bookmarkedLoading ? (
            <StateCard type="loading" title="正在加载收藏夹..." />
          ) : bookmarkedBlogs.length === 0 ? (
            <StateCard type="empty" title="收藏夹内暂无文章" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {bookmarkedBlogs.map((blog: BlogListItem) => (
                <FolioBlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FolioBlogCard({ blog, showStatus = false }: { blog: BlogListItem; showStatus?: boolean }) {
  const statusMeta = REVIEW_STATUS_META[blog.status as keyof typeof REVIEW_STATUS_META]

  return (
    <article className="card p-0 overflow-hidden flex flex-col justify-between group">
      <div>
        <Link to={`/blog/${blog.id}`} className="block">
          <EditorialCover
            src={blog.image}
            title={blog.title}
            seed={blog.id}
            category={blog.category || '博客文章'}
            aspectClass="aspect-[16/9]"
            roundedClass="rounded-none"
            className="border-0 border-b"
            cursorLabel="阅读全文"
          />
        </Link>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs text-ink-400">
            <span>{dayjs(blog.createdAt).format('YYYY-MM-DD')}</span>
            {showStatus && statusMeta && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusMeta.badgeClass}`}>
                {statusMeta.label}
              </span>
            )}
          </div>

          <Link to={`/blog/${blog.id}`} className="block">
            <h3 className="font-editorial-serif text-xl font-bold text-ink-900 dark:text-ink-50 line-clamp-2">
              <span className="editorial-link">{blog.title}</span>
            </h3>
          </Link>

          {blog.summary && (
            <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 line-clamp-2">
              {blog.summary}
            </p>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs text-ink-400">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <FiEye size={12} /> {blog.views || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiHeart size={12} /> {blog.likesCount || 0}
          </span>
        </div>
        {showStatus && blog.status === 'SCHEDULED' && blog.publishAt && (
          <span className="inline-flex items-center gap-1 text-vermilion text-[11px]">
            <FiClock size={11} />
            {dayjs(blog.publishAt).format('MM-DD HH:mm')}
          </span>
        )}
      </div>
    </article>
  )
}
