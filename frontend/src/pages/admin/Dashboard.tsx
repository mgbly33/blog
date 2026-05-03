import { useQuery } from '@tanstack/react-query'
import { FiUsers, FiFileText, FiMessageSquare, FiClock, FiAlertCircle, FiEye } from 'react-icons/fi'
import { adminApi, DashboardStats } from '@/api/admin'
import { Link } from 'react-router-dom'

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: string
  link?: string
}

function StatCard({ title, value, icon: Icon, color, link }: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
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
    refetchInterval: 5000, // Auto refresh every 5 seconds
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not focused
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        加载失败，请刷新页面重试
      </div>
    )
  }

  const stats = data as DashboardStats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来，这是系统概览</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="总用户数"
          value={stats.totalUsers}
          icon={FiUsers}
          color="bg-blue-500"
          link="/admin/users"
        />
        <StatCard
          title="总文章数"
          value={stats.totalBlogs}
          icon={FiFileText}
          color="bg-green-500"
          link="/admin/blogs"
        />
        <StatCard
          title="总评论数"
          value={stats.totalComments}
          icon={FiMessageSquare}
          color="bg-purple-500"
        />
        <StatCard
          title="待审核文章"
          value={stats.pendingBlogs}
          icon={FiClock}
          color="bg-yellow-500"
          link="/admin/blogs?status=PENDING"
        />
        <StatCard
          title="已封禁用户"
          value={stats.bannedUsers}
          icon={FiAlertCircle}
          color="bg-red-500"
          link="/admin/users?banned=true"
        />
        <StatCard
          title="今日浏览"
          value={stats.todayViews}
          icon={FiEye}
          color="bg-indigo-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/blogs?status=PENDING"
            className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
          >
            <FiClock size={20} />
            <span>审核待处理文章</span>
            {stats.pendingBlogs > 0 && (
              <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.pendingBlogs}
              </span>
            )}
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <FiUsers size={20} />
            <span>管理用户</span>
          </Link>
          <Link
            to="/admin/blogs"
            className="flex items-center gap-3 p-4 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            <FiFileText size={20} />
            <span>管理文章</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FiEye size={20} />
            <span>查看前台</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
