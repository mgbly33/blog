import { FiFileText, FiHeart, FiBookmark, FiUsers, FiThumbsUp } from 'react-icons/fi'

interface StatsBarProps {
  blogCount: number
  receivedLikeCount: number
  likedCount: number
  bookmarkCount?: number
  followerCount: number
}

export default function StatsBar({
  blogCount,
  receivedLikeCount,
  likedCount,
  bookmarkCount = 0,
  followerCount,
}: StatsBarProps) {
  const stats = [
    { label: '文章', value: blogCount, icon: FiFileText, color: 'text-blue-500' },
    { label: '获赞', value: receivedLikeCount, icon: FiHeart, color: 'text-pink-500' },
    { label: '我点赞', value: likedCount, icon: FiThumbsUp, color: 'text-indigo-500' },
    { label: '收藏', value: bookmarkCount, icon: FiBookmark, color: 'text-amber-500' },
    { label: '粉丝', value: followerCount, icon: FiUsers, color: 'text-green-500' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center rounded-xl bg-white/50 p-4 backdrop-blur-sm transition-transform hover:scale-105"
        >
          <stat.icon className={`${stat.color} mb-2`} size={24} />
          <span className="text-2xl font-bold text-gray-800">{formatNumber(stat.value)}</span>
          <span className="text-sm text-gray-500">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}百万`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}千`
  }
  return num.toString()
}
