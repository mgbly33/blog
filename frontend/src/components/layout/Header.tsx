import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FiBookOpen,
  FiCompass,
  FiFeather,
  FiFileText,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiSettings,
  FiShield,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { notificationApi } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'

export default function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 60000,
  })
  const unreadCount = unreadCountData?.data?.count ?? 0

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 18)

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollHeight <= 0 ? 0 : (window.scrollY / scrollHeight) * 100
      setScrollProgress(Math.max(0, Math.min(100, progress)))
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const keyword = searchQuery.trim()
    if (!keyword) {
      return
    }

    navigate(`/search?q=${encodeURIComponent(keyword)}`)
    setSearchQuery('')
    setShowMobileMenu(false)
  }

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    setShowMobileMenu(false)
    navigate('/')
  }

  const closeMobileMenu = () => setShowMobileMenu(false)
  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')
  const navItems = isAuthenticated
    ? [
        { to: '/', label: '首页' },
        { to: '/search', label: '发现' },
        { to: '/editor', label: '创作' },
        { to: '/my-content?tab=drafts', label: '草稿' },
        { to: '/series', label: '专栏' },
        { to: '/notifications', label: unreadCount > 0 ? `通知(${unreadCount})` : '通知' },
      ]
    : [
        { to: '/', label: '首页' },
        { to: '/search', label: '发现' },
      ]

  return (
    <header className="site-header sticky top-0 z-50">
      <div
        className="header-progress"
        style={{ '--progress-width': `${scrollProgress}%` } as React.CSSProperties}
      ></div>

      <div className={`header-shell ${scrolled ? 'header-shell-scrolled' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="h-16 md:h-[74px] flex items-center gap-3 md:gap-4">
            <Link to="/" className="navbar-brand brand-mark">
              <span className="brand-icon-wrap">
                <FiFeather className="text-xl" />
              </span>
              <span className="brand-copy">
                <span className="brand-title">现代博客</span>
                <span className="brand-subtitle">创作与工程</span>
              </span>
            </Link>

            <nav className="ml-4 hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link nav-link-premium ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <form onSubmit={handleSearch} className="hidden xl:flex flex-1 max-w-md mx-auto">
              <div className="relative w-full header-search">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索文章、标签、作者..."
                  className="input pr-10 header-search-input"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                  aria-label="搜索"
                >
                  <FiSearch size={18} />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2 md:gap-3 ml-auto">
              {isAuthenticated ? (
                <>
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu((prev) => !prev)}
                      className="user-avatar-btn"
                      aria-label="用户菜单"
                    >
                      <img
                        src={
                          user?.avatar ||
                          `https://ui-avatars.com/api/?name=${user?.username}&background=E8B4B8&color=fff`
                        }
                        alt={user?.username || '头像'}
                        className="w-9 h-9 rounded-full"
                      />
                    </button>

                    {showUserMenu && (
                      <div className="dropdown-menu dropdown-menu-premium absolute right-0 mt-3">
                        <div className="px-4 py-3 border-b border-primary-100/60">
                          <p className="font-semibold text-slate-800">{user?.username}</p>
                          <p className="text-xs text-slate-500 tracking-wide mt-1">
                            {isAdminUser ? '管理员' : '普通用户'}账号
                          </p>
                        </div>

                        <Link
                          to={`/user/${user?.username}`}
                          className="dropdown-item flex items-center gap-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FiUser size={16} />
                          个人主页
                        </Link>
                        <Link
                          to="/my-content?tab=drafts"
                          className="dropdown-item flex items-center gap-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FiFileText size={16} />
                          我的内容
                        </Link>
                        <Link
                          to="/series"
                          className="dropdown-item flex items-center gap-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FiBookOpen size={16} />
                          {isAdminUser ? '专栏管理' : '专栏目录'}
                        </Link>
                        <Link
                          to="/settings"
                          className="dropdown-item flex items-center gap-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FiSettings size={16} />
                          设置
                        </Link>

                        {isAdminUser && (
                          <>
                            <hr className="my-1 border-primary-100/60" />
                            <Link
                              to="/admin"
                              className="dropdown-item flex items-center gap-2 text-purple-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <FiShield size={16} />
                              管理后台
                            </Link>
                          </>
                        )}

                        <hr className="my-1 border-primary-100/60" />
                        <button
                          onClick={handleLogout}
                          className="dropdown-item flex items-center gap-2 w-full text-left text-red-600 hover:text-red-700"
                        >
                          <FiLogOut size={16} />
                          退出登录
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login" className="btn btn-secondary btn-sm">
                    登录
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm magnetic-btn">
                    注册
                  </Link>
                </div>
              )}

              <button
                className="md:hidden icon-action"
                onClick={() => setShowMobileMenu((prev) => !prev)}
                aria-label="菜单"
              >
                {showMobileMenu ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>

          {showMobileMenu && (
            <div className="mobile-menu-panel md:hidden mb-4">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="搜索文章..."
                    className="input pr-10"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-label="搜索"
                  >
                    <FiSearch size={18} />
                  </button>
                </div>
              </form>

              <nav className="flex flex-col gap-2 mb-4">
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className="nav-link nav-link-premium" onClick={closeMobileMenu}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {!isAuthenticated && (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="btn btn-secondary flex-1 text-center"
                    onClick={closeMobileMenu}
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary flex-1 text-center"
                    onClick={closeMobileMenu}
                  >
                    注册
                  </Link>
                </div>
              )}

              {isAuthenticated && (
                <div className="pt-2 border-t border-primary-100/70 text-xs text-slate-500 flex items-center gap-2">
                  <FiCompass size={14} />
                  <span>探索更多内容和创作灵感</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
