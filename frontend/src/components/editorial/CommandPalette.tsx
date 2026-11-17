import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiArrowUpRight,
  FiBookOpen,
  FiClock,
  FiCompass,
  FiEdit3,
  FiFileText,
  FiHome,
  FiMoon,
  FiSearch,
  FiShield,
  FiSun,
  FiX,
} from 'react-icons/fi'
import { blogApi } from '@/api/blog'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import type { BlogListItem } from '@/types'

interface PaletteItem {
  id: string
  group: 'ESSAYS' | 'ACTIONS'
  title: string
  subtitle?: string
  icon: React.ReactNode
  onSelect: () => void
}

export default function CommandPalette() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleCommandPalette,
    theme,
    toggleTheme,
  } = useUIStore()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleCommandPalette()
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 200)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (commandPaletteOpen) {
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 40)
    } else {
      setQuery('')
      setDebouncedQuery('')
    }
  }, [commandPaletteOpen])

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['palette-blogs', debouncedQuery],
    queryFn: () =>
      debouncedQuery
        ? blogApi.searchBlogs(debouncedQuery, 0, 6)
        : blogApi.getBlogs(0, 5),
    enabled: commandPaletteOpen,
  })

  const blogs: BlogListItem[] = searchResults?.data?.content || []

  const closeAndGo = (path: string) => {
    setCommandPaletteOpen(false)
    navigate(path)
  }

  const actionItems: PaletteItem[] = useMemo(() => {
    const base: PaletteItem[] = [
      {
        id: 'act-home',
        group: 'ACTIONS',
        title: '返回博客首页',
        subtitle: '浏览推荐文章与最新动态',
        icon: <FiHome size={15} />,
        onSelect: () => closeAndGo('/'),
      },
      {
        id: 'act-archive',
        group: 'ACTIONS',
        title: debouncedQuery ? `全文搜索 “${debouncedQuery}”` : '探索全部博客文章',
        subtitle: '按分类、标签或关键词筛选',
        icon: <FiCompass size={15} />,
        onSelect: () =>
          closeAndGo(debouncedQuery ? `/search?q=${encodeURIComponent(debouncedQuery)}` : '/search'),
      },
      {
        id: 'act-series',
        group: 'ACTIONS',
        title: '浏览系列专栏',
        subtitle: '体系化专题文章连载',
        icon: <FiBookOpen size={15} />,
        onSelect: () => closeAndGo('/series'),
      },
      {
        id: 'act-theme',
        group: 'ACTIONS',
        title: theme === 'dark' ? '切换至暖雾浅色模式' : '切换至柔和夜间模式',
        subtitle: '切换日间/夜间阅读主题',
        icon: theme === 'dark' ? <FiSun size={15} /> : <FiMoon size={15} />,
        onSelect: () => {
          toggleTheme()
          setCommandPaletteOpen(false)
        },
      },
    ]

    if (isAuthenticated) {
      base.unshift({
        id: 'act-write',
        group: 'ACTIONS',
        title: '写新文章',
        subtitle: '打开 Markdown 创作编辑器',
        icon: <FiEdit3 size={15} />,
        onSelect: () => closeAndGo('/editor'),
      })
      base.push({
        id: 'act-history',
        group: 'ACTIONS',
        title: '查看阅读历史',
        subtitle: '继续阅读上次浏览的文章',
        icon: <FiClock size={15} />,
        onSelect: () => closeAndGo('/history'),
      })
    }

    if (isAdminUser) {
      base.push({
        id: 'act-admin',
        group: 'ACTIONS',
        title: '进入管理后台',
        subtitle: '文章审核、用户与敏感词治理',
        icon: <FiShield size={15} />,
        onSelect: () => closeAndGo('/admin'),
      })
    }

    if (!debouncedQuery) return base
    const lower = debouncedQuery.toLowerCase()
    return base.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(lower)) ||
        item.id === 'act-archive'
    )
  }, [debouncedQuery, theme, isAuthenticated, isAdminUser])

  const essayItems: PaletteItem[] = useMemo(
    () =>
      blogs.map((post) => ({
        id: `essay-${post.id}`,
        group: 'ESSAYS',
        title: post.title,
        subtitle: `${post.author?.username || '作者'} · 约 ${post.readTime || 3} 分钟阅读`,
        icon: <FiFileText size={15} />,
        onSelect: () => closeAndGo(`/blog/${post.id}`),
      })),
    [blogs]
  )

  const combinedItems = useMemo(() => [...essayItems, ...actionItems], [essayItems, actionItems])

  useEffect(() => {
    setActiveIndex(0)
  }, [debouncedQuery, blogs.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (combinedItems.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % combinedItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + combinedItems.length) % combinedItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const current = combinedItems[activeIndex]
      if (current) current.onSelect()
      else if (query.trim()) closeAndGo(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[9995] bg-[#111110]/45 backdrop-blur-md flex items-start justify-center pt-[12vh] px-4"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.97, filter: 'blur(6px)' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl rounded-3xl bg-[#FAF8F4]/95 dark:bg-[#191817]/95 backdrop-blur-2xl border border-hairline-light dark:border-hairline-dark shadow-editorial-float overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 px-6 py-4 border-b border-hairline-light dark:border-hairline-dark">
              <FiSearch className="text-vermilion shrink-0" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索博客文章、技术标签，或执行快捷操作..."
                className="flex-1 bg-transparent text-base text-ink-800 dark:text-ink-50 placeholder:text-ink-400 focus:outline-none"
              />
              {isFetching && (
                <span className="text-xs text-vermilion animate-pulse">搜索中...</span>
              )}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="w-7 h-7 rounded-full bg-paper-200/80 dark:bg-white/10 flex items-center justify-center text-ink-400 hover:text-ink-800 dark:hover:text-white transition-colors"
              >
                <FiX size={15} />
              </button>
            </div>

            <div className="max-h-[58vh] overflow-y-auto p-3 space-y-3">
              {essayItems.length > 0 && (
                <div>
                  <div className="px-3 pb-1.5 text-xs text-ink-400 flex items-center justify-between">
                    <span>{debouncedQuery ? '匹配文章' : '最新文章'}</span>
                    <span>{essayItems.length} 篇</span>
                  </div>
                  <div className="space-y-0.5">
                    {essayItems.map((item, idx) => {
                      const isSelected = idx === activeIndex
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={item.onSelect}
                          className="relative w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-colors"
                        >
                          {isSelected && (
                            <motion.span
                              layoutId="palette-active-row"
                              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                              className="absolute inset-0 rounded-2xl bg-paper-200 dark:bg-white/[0.07] -z-10"
                            />
                          )}
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={isSelected ? 'text-vermilion' : 'text-ink-400'}>
                              {item.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="font-editorial-serif text-lg font-medium text-ink-800 dark:text-ink-50 truncate">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-xs text-ink-400 truncate">{item.subtitle}</p>
                              )}
                            </div>
                          </div>
                          <FiArrowUpRight
                            size={15}
                            className={`shrink-0 transition-all ${
                              isSelected ? 'text-vermilion translate-x-0.5 -translate-y-0.5 opacity-100' : 'opacity-0'
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {actionItems.length > 0 && (
                <div>
                  <div className="px-3 pb-1.5 text-xs text-ink-400">
                    快捷导航
                  </div>
                  <div className="space-y-0.5">
                    {actionItems.map((item, idx) => {
                      const globalIndex = essayItems.length + idx
                      const isSelected = globalIndex === activeIndex
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(globalIndex)}
                          onClick={item.onSelect}
                          className="relative w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-colors"
                        >
                          {isSelected && (
                            <motion.span
                              layoutId="palette-active-row"
                              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                              className="absolute inset-0 rounded-2xl bg-paper-200 dark:bg-white/[0.07] -z-10"
                            />
                          )}
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={isSelected ? 'text-vermilion' : 'text-ink-400'}>
                              {item.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink-800 dark:text-ink-50 truncate">
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="text-xs text-ink-400 truncate">{item.subtitle}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-ink-400 font-editorial-mono">↵</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-2.5 bg-paper-200/50 dark:bg-white/[0.03] border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs text-ink-400">
              <div className="flex items-center gap-4">
                <span>↑↓ 选择</span>
                <span>↵ 打开</span>
                <span>ESC 关闭</span>
              </div>
              <span>快捷搜索 ⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
