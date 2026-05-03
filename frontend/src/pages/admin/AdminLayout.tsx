import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FiHome, FiUsers, FiFileText, FiArrowLeft, FiFolder, FiTag, FiActivity, FiShield, FiAlertTriangle, FiSlash, FiBookOpen } from 'react-icons/fi'
import { useAuthStore } from '@/stores/authStore'

const sidebarLinks = [
  { to: '/admin', icon: FiHome, label: '仪表盘', end: true },
  { to: '/admin/users', icon: FiUsers, label: '用户管理' },
  { to: '/admin/blogs', icon: FiFileText, label: '文章管理' },
  { to: '/admin/series', icon: FiBookOpen, label: '专栏管理' },
  { to: '/admin/categories', icon: FiFolder, label: '分类管理' },
  { to: '/admin/tags', icon: FiTag, label: '标签管理' },
  { to: '/admin/logs', icon: FiActivity, label: '操作日志' },
  { to: '/admin/reports', icon: FiAlertTriangle, label: '举报管理' },
  { to: '/admin/sensitive-words', icon: FiSlash, label: '敏感词管理' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <FiArrowLeft size={20} />
              <span className="hidden sm:inline">返回前台</span>
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <FiShield className="text-primary-600" size={24} />
              <h1 className="text-xl font-bold text-gray-800">管理后台</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=E8B4B8&color=fff`}
              alt={user?.username}
              className="w-8 h-8 rounded-full ring-2 ring-primary-100"
            />
            <span className="text-sm font-medium text-gray-700">{user?.username}</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-1">
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <link.icon size={20} />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
