import { motion } from 'framer-motion'

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
    { label: '发布文章', value: blogCount },
    { label: '获得喜欢', value: receivedLikeCount },
    { label: '关注者', value: followerCount },
    { label: '点赞记录', value: likedCount },
    { label: '收藏文章', value: bookmarkCount },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.05 }}
          whileHover={{ y: -3 }}
          className="p-4 sm:p-5 rounded-3xl bg-[#FAF8F4]/80 dark:bg-[#191817]/85 backdrop-blur-2xl border border-hairline-light dark:border-hairline-dark shadow-editorial text-center space-y-1"
        >
          <p className="font-editorial-serif text-3xl font-semibold text-gradient-luminous">
            {formatNumber(stat.value)}
          </p>
          <p className="text-xs text-ink-500 dark:text-ink-300">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}
