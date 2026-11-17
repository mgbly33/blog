import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiArrowLeft,
  FiFolder,
  FiTag,
  FiActivity,
  FiAlertTriangle,
  FiSlash,
  FiBookOpen,
  FiMoon,
  FiSun,
  FiMenu,
  FiX,
} from 'react-icons/fi'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

const sidebarLinks = [
  { to: '/admin', icon: FiHome, label: '数据概览', end: true },
  { to: '/admin/blogs', icon: FiFileText, label: '文章管理' },
  { to: '/admin/series', icon: FiBookOpen, label: '系列专栏' },
  { to: '/admin/categories', icon: FiFolder, label: '分类管理' },
  { to: '/admin/tags', icon: FiTag, label: '标签管理' },
  { to: '/admin/users', icon: FiUsers, label: '用户管理' },
  { to: '/admin/reports', icon: FiAlertTriangle, label: '举报管理' },
  { to: '/admin/sensitive-words', icon: FiSlash, label: '敏感词管理' },
  { to: '/admin/logs', icon: FiActivity, label: '操作日志' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-paper-100 dark:bg-ink-900 text-ink-800 dark:text-ink-50 transition-colors">
      {/* Top Admin Header */}
      <header className="bg-[#FAF8F4]/90 dark:bg-[#191817]/90 backdrop-blur-xl border-b border-hairline-light dark:border-hairline-dark sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-full text-ink-600 dark:text-ink-200 hover:bg-paper-200 dark:hover:bg-white/10"
              aria-label="展开管理菜单"
            >
              {mobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-300 hover:text-vermilion transition-colors"
            >
              <FiArrowLeft size={15} />
              <span>返回博客前台</span>
            </button>

            <div className="h-4 w-px bg-hairline-light dark:bg-hairline-dark" />

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-vermilion" />
              <h1 className="font-editorial-serif text-lg font-bold text-ink-900 dark:text-ink-50">
                博客管理后台
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-paper-200/70 dark:bg-white/10 text-ink-700 dark:text-ink-100 hover:text-vermilion transition-colors"
              title={theme === 'dark' ? '切换浅色模式' : '切换夜间模式'}
            >
              {theme === 'dark' ? <FiSun size={15} /> : <FiMoon size={15} />}
            </button>
            <div className="flex items-center gap-2">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${user?.username}&background=9E6B52&color=FAF8F4`
                }
                alt={user?.username}
                className="w-7 h-7 rounded-full border border-hairline-light dark:border-hairline-dark object-cover"
              />
              <span className="hidden sm:inline text-xs font-semibold text-ink-800 dark:text-ink-100">
                {user?.username}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <nav className="md:hidden px-4 pb-4 pt-2 border-t border-hairline-light dark:border-hairline-dark grid grid-cols-2 gap-1.5 bg-[#FAF8F4] dark:bg-[#191817]">
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                    isActive
                      ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-semibold'
                      : 'text-ink-600 dark:text-ink-300 hover:bg-paper-200 dark:hover:bg-white/[0.06]'
                  }`
                }
              >
                <link.icon size={14} />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-56 bg-[#FAF8F4]/75 dark:bg-[#191817]/75 border-r border-hairline-light dark:border-hairline-dark min-h-[calc(100vh-3.5rem)] sticky top-14 shrink-0 hidden md:block">
          <nav className="p-3.5 space-y-1">
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
                    isActive
                      ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 font-semibold shadow-sm'
                      : 'text-ink-600 dark:text-ink-300 hover:bg-paper-200/70 dark:hover:bg-white/[0.06]'
                  }`
                }
              >
                <link.icon size={15} />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-5 sm:p-8 max-w-6xl min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
