import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiBell,
  FiBookOpen,
  FiClock,
  FiCompass,
  FiEdit3,
  FiFeather,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMail,
  FiMoon,
  FiSearch,
  FiSettings,
  FiShield,
  FiSun,
  FiUser,
} from 'react-icons/fi'
import { notificationApi } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore, type PaperTint } from '@/stores/uiStore'

const PAPER_TINTS: Array<{ id: PaperTint; label: string; dot: string }> = [
  { id: 'oat', label: '暖燕麦', dot: '#EAE3D5' },
  { id: 'sage', label: '青茗护眼', dot: '#DCE6D9' },
  { id: 'parchment', label: '羊皮暖金', dot: '#E8DEC8' },
  { id: 'porcelain', label: '素宣白瓷', dot: '#F4F4F0' },
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, toggleTheme, paperTint, setPaperTint, setCommandPaletteOpen } = useUIStore()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 60000,
  })
  const unreadCount = unreadCountData?.data?.count ?? 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    navigate('/')
  }

  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')
  const isSubPage = location.pathname !== '/'

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const navLinks = [
    {
      id: 'home',
      label: '精选首页',
      to: '/',
      icon: FiHome,
      active: location.pathname === '/',
    },
    {
      id: 'discover',
      label: '探索归档',
      to: '/search',
      icon: FiCompass,
      active:
        location.pathname.startsWith('/search') ||
        location.pathname.startsWith('/category') ||
        location.pathname.startsWith('/tag'),
    },
    {
      id: 'series',
      label: '系列专栏',
      to: '/series',
      icon: FiBookOpen,
      active: location.pathname.startsWith('/series'),
    },
    ...(isAuthenticated
      ? [
          {
            id: 'workspace',
            label: '创作中心',
            to: '/my-content?tab=drafts',
            icon: FiFileText,
            active:
              location.pathname.startsWith('/my-content') ||
              location.pathname.startsWith('/editor'),
          },
        ]
      : []),
  ]

  return (
    <header className="relative z-40 w-full max-w-[1480px] mx-auto px-5 sm:px-8 lg:px-12 pt-5 pb-3">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-hairline-light dark:border-hairline-dark">
        {/* Left: Brand Identity + Contextual Back Button */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="group flex items-center gap-3">
            <motion.span
              whileHover={{ rotate: 12, scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 360, damping: 18 }}
              className="w-9 h-9 rounded-full bg-ink-800 dark:bg-ink-50 text-paper-50 dark:text-ink-900 flex items-center justify-center shadow-sm"
            >
              <FiFeather size={15} />
            </motion.span>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-editorial-serif text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
                  现代博客
                </span>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[9px] font-editorial-mono uppercase tracking-[0.18em] bg-vermilion/10 text-vermilion font-medium">
                  EDITORIAL
                </span>
              </div>
              <p className="hidden 2xl:block text-[10px] font-editorial-mono uppercase tracking-[0.2em] text-ink-400 -mt-0.5">
                MODERN BLOG & THINKING GARDEN
              </p>
            </div>
          </Link>

          {isSubPage && (
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-[#FAF8F4]/90 dark:bg-[#191817]/90 border border-hairline-light dark:border-hairline-dark text-ink-700 dark:text-ink-200 hover:border-vermilion hover:text-vermilion shadow-sm transition-all"
              title="返回上一页"
            >
              <FiArrowLeft size={13} />
              <span>返回上一页</span>
            </button>
          )}
        </div>

        {/* Center: Floating Segmented Navigation Capsule */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full shrink-0 bg-[#FAF8F4]/85 dark:bg-[#191817]/85 backdrop-blur-2xl border border-hairline-light dark:border-hairline-dark shadow-sm">
          {navLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  item.active
                    ? 'text-paper-50 dark:text-ink-900'
                    : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                {item.active && (
                  <motion.span
                    layoutId="header-nav-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-ink-800 dark:bg-ink-50 -z-10 shadow-sm"
                  />
                )}
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right: Quick Search, Paper Tint, Write CTA, Notifications & User */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Paper Tint Swatches (Light Mode Desktop) */}
          {theme === 'light' && (
            <div
              className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#FAF8F4]/80 border border-hairline-light"
              title="切换纸张底色"
            >
              {PAPER_TINTS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPaperTint(t.id)}
                  title={`纸张底色：${t.label}`}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    paperTint === t.id
                      ? 'scale-110 ring-2 ring-vermilion ring-offset-1'
                      : 'opacity-75 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: t.dot }}
                />
              ))}
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换浅色模式' : '切换夜间模式'}
            title={theme === 'dark' ? '切换暖昼纸张模式' : '切换暗房胶片模式'}
            className="w-9 h-9 rounded-full bg-[#FAF8F4]/80 dark:bg-[#191817]/80 backdrop-blur-xl border border-hairline-light dark:border-hairline-dark flex items-center justify-center text-ink-600 dark:text-ink-200 hover:border-vermilion hover:text-vermilion transition-colors"
          >
            {theme === 'dark' ? <FiSun size={14} /> : <FiMoon size={14} />}
          </button>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="搜索文章"
            className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#FAF8F4]/80 dark:bg-[#191817]/80 backdrop-blur-xl border border-hairline-light dark:border-hairline-dark text-xs text-ink-500 dark:text-ink-300 hover:border-vermilion transition-all"
          >
            <FiSearch size={13} className="text-vermilion" />
            <span className="hidden sm:inline">搜索文章...</span>
            <kbd className="hidden lg:inline font-editorial-mono text-[10px] px-1.5 py-0.5 rounded bg-paper-200/80 dark:bg-white/10 text-ink-500 dark:text-ink-300">
              ⌘K
            </kbd>
          </button>

          {isAuthenticated && (
            <>
              <Link
                to="/editor"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors shadow-sm"
              >
                <FiEdit3 size={12} />
                <span>写文章</span>
              </Link>

              <Link
                to="/notifications"
                className="relative w-9 h-9 rounded-full bg-[#FAF8F4]/80 dark:bg-[#191817]/80 backdrop-blur-xl border border-hairline-light dark:border-hairline-dark flex items-center justify-center text-ink-600 dark:text-ink-200 hover:border-vermilion transition-colors"
                title="消息通知"
              >
                <FiBell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-vermilion animate-pulse" />
                )}
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[#FAF8F4]/85 dark:bg-[#191817]/85 backdrop-blur-xl border border-hairline-light dark:border-hairline-dark hover:border-vermilion transition-all focus:outline-none"
              >
                <img
                  src={
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${user?.username}&background=9E6B52&color=FAF8F4`
                  }
                  alt={user?.username}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-xs font-medium text-ink-800 dark:text-ink-100 max-w-[90px] truncate">
                  {user?.username}
                </span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#FAF8F4]/95 dark:bg-[#191817]/95 backdrop-blur-2xl border border-hairline-light dark:border-hairline-dark shadow-editorial-float p-2 z-50"
                  >
                    <div className="px-3.5 py-2.5 mb-1 rounded-xl bg-paper-200/60 dark:bg-white/[0.04]">
                      <p className="font-semibold text-sm text-ink-800 dark:text-ink-50 truncate">
                        {user?.username}
                      </p>
                      <p className="text-[11px] text-ink-400 mt-0.5">
                        {isAdminUser ? '社区管理员' : '专栏创作者'}
                      </p>
                    </div>

                    <Link
                      to={`/user/${user?.username}`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-ink-700 dark:text-ink-200 hover:bg-paper-200/70 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <FiUser size={13} className="text-vermilion" />
                      <span>个人主页</span>
                    </Link>
                    <Link
                      to="/my-content?tab=drafts"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-ink-700 dark:text-ink-200 hover:bg-paper-200/70 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <FiFileText size={13} className="text-ink-400" />
                      <span>我的文章与草稿</span>
                    </Link>
                    <Link
                      to="/messages"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-ink-700 dark:text-ink-200 hover:bg-paper-200/70 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <FiMail size={13} className="text-ink-400" />
                      <span>站内私信</span>
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-ink-700 dark:text-ink-200 hover:bg-paper-200/70 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <FiClock size={13} className="text-ink-400" />
                      <span>阅读历史</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-ink-700 dark:text-ink-200 hover:bg-paper-200/70 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <FiSettings size={13} className="text-ink-400" />
                      <span>账号设置</span>
                    </Link>

                    {isAdminUser && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 mt-1 rounded-xl text-xs font-medium text-vermilion bg-vermilion/10 hover:bg-vermilion/20 transition-colors"
                      >
                        <FiShield size={13} />
                        <span>管理后台</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 mt-1 rounded-xl text-xs text-red-700 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <FiLogOut size={13} />
                      <span>退出登录</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#FAF8F4]/80 dark:bg-[#191817]/80 backdrop-blur-xl border border-hairline-light dark:border-hairline-dark text-ink-700 dark:text-ink-200 hover:border-vermilion transition-colors"
              >
                登录
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
