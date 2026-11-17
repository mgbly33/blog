import { useQuery } from '@tanstack/react-query'
import {
  FiUsers,
  FiFileText,
  FiMessageSquare,
  FiClock,
  FiAlertCircle,
  FiEye,
  FiArrowUpRight,
} from 'react-icons/fi'
import { adminApi, DashboardStats } from '@/api/admin'
import { Link } from 'react-router-dom'
import StateCard from '@/components/ui/StateCard'

interface StatCardProps {
  title: string
  en: string
  value: number
  icon: React.ElementType
  highlight?: boolean
  link?: string
}

function StatCard({ title, en, value, icon: Icon, highlight, link }: StatCardProps) {
  const content = (
    <div
      className={`card p-6 group ${
        highlight ? 'border-l-4 border-l-vermilion' : ''
      }`}
    >
      <div className="flex items-center justify-between text-[10px] font-editorial-mono uppercase tracking-[0.18em] text-ink-400 mb-3">
        <span>{en}</span>
        <Icon size={15} className={highlight ? 'text-vermilion' : 'text-ink-400'} />
      </div>
      <p className="font-editorial-serif text-4xl font-bold text-ink-900 dark:text-ink-50">
        {value.toLocaleString()}
      </p>
      <div className="mt-2 flex items-center justify-between text-xs text-ink-500 dark:text-ink-300">
        <span>{title}</span>
        {link && (
          <FiArrowUpRight
            size={13}
            className="opacity-0 group-hover:opacity-100 text-vermilion transition-opacity"
          />
        )}
      </div>
    </div>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }
  return content
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await adminApi.getDashboardStats()
      return response.data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  if (isLoading) {
    return <StateCard type="loading" title="正在加载运营数据概览..." />
  }

  if (error) {
    return <StateCard type="error" title="无法读取仪表盘数据" description="请刷新页面重试" />
  }

  const stats = data as DashboardStats

  return (
    <div className="space-y-8">
      <header className="border-b border-hairline-light dark:border-hairline-dark pb-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-editorial-mono uppercase tracking-[0.22em] text-vermilion font-semibold">
            DASHBOARD OVERVIEW
          </p>
          <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50 mt-0.5">
            平台数据概览
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="注册用户总数"
          en="TOTAL USERS"
          value={stats.totalUsers}
          icon={FiUsers}
          link="/admin/users"
        />
        <StatCard
          title="博客文章总数"
          en="TOTAL POSTS"
          value={stats.totalBlogs}
          icon={FiFileText}
          link="/admin/blogs"
        />
        <StatCard
          title="待审核文章"
          en="PENDING REVIEW"
          value={stats.pendingBlogs}
          icon={FiClock}
          highlight={stats.pendingBlogs > 0}
          link="/admin/blogs?status=PENDING"
        />
        <StatCard
          title="互动评论总数"
          en="COMMENTS"
          value={stats.totalComments}
          icon={FiMessageSquare}
        />
        <StatCard
          title="今日浏览量"
          en="TODAY VIEWS"
          value={stats.todayViews}
          icon={FiEye}
        />
        <StatCard
          title="已封禁账号"
          en="BANNED USERS"
          value={stats.bannedUsers}
          icon={FiAlertCircle}
          link="/admin/users"
        />
      </div>

      <section className="card space-y-4 hover:transform-none">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-600 dark:text-ink-200 pb-2.5 border-b border-hairline-light dark:border-hairline-dark">
          常用快捷入口
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <Link
            to="/admin/blogs?status=PENDING"
            className="p-4 rounded-2xl border border-hairline-light dark:border-hairline-dark hover:border-vermilion flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-ink-800 dark:text-ink-100">审核待发布文章</span>
            <span className="badge badge-vermilion">{stats.pendingBlogs}</span>
          </Link>
          <Link
            to="/admin/blogs"
            className="p-4 rounded-2xl border border-hairline-light dark:border-hairline-dark hover:border-vermilion flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-ink-800 dark:text-ink-100">管理全部文章</span>
            <FiArrowUpRight size={14} />
          </Link>
          <Link
            to="/admin/users"
            className="p-4 rounded-2xl border border-hairline-light dark:border-hairline-dark hover:border-vermilion flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-ink-800 dark:text-ink-100">管理注册用户</span>
            <FiArrowUpRight size={14} />
          </Link>
          <Link
            to="/"
            className="p-4 rounded-2xl border border-hairline-light dark:border-hairline-dark hover:border-vermilion flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-ink-800 dark:text-ink-100">前往博客首页</span>
            <FiArrowUpRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
