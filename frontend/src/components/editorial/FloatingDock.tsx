import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import {
  FiBookOpen,
  FiCompass,
  FiEdit3,
  FiFileText,
  FiHome,
  FiMail,
  FiMoon,
  FiSearch,
  FiSun,
} from 'react-icons/fi'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

interface DockEntry {
  id: string
  label: string
  icon: React.ReactNode
  isActive?: boolean
  hideOnMobile?: boolean
  onClick: () => void
}

function DockIconButton({
  item,
  mouseX,
}: {
  item: DockEntry
  mouseX: MotionValue<number>
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [hovered, setHovered] = useState(false)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const sizeSync = useTransform(distance, [-130, 0, 130], [38, 52, 38])
  const size = useSpring(sizeSync, { mass: 0.12, stiffness: 240, damping: 18 })

  return (
    <div
      className={`relative h-[38px] flex items-end justify-center shrink-0 ${
        item.hideOnMobile ? 'hidden sm:flex' : 'flex'
      }`}
    >
      <motion.button
        ref={ref}
        type="button"
        style={{ width: size, height: size }}
        whileTap={{ scale: 0.9 }}
        onMouseEnter={() => {
          if (window.matchMedia('(hover: hover)').matches) setHovered(true)
        }}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          setHovered(false)
          mouseX.set(Infinity)
          item.onClick()
        }}
        aria-label={item.label}
        className={`relative rounded-full flex items-center justify-center transition-colors ${
          item.isActive
            ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 shadow-sm'
            : 'bg-paper-50/85 dark:bg-white/[0.08] text-ink-600 dark:text-ink-200 hover:text-ink-900 dark:hover:text-white border border-hairline-light dark:border-hairline-dark'
        }`}
      >
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.94 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none hidden sm:inline-flex absolute bottom-[calc(100%+12px)] px-3 py-1 rounded-full bg-[#1C1B19]/95 dark:bg-[#F2EFE9]/95 text-[#FAF8F4] dark:text-[#111110] text-[11px] font-medium whitespace-nowrap shadow-lg z-50"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {item.icon}
      </motion.button>

      {item.isActive && (
        <motion.span
          layoutId="dock-active-dot"
          className="pointer-events-none absolute -bottom-1.5 w-1 h-1 rounded-full bg-vermilion"
        />
      )}
    </div>
  )
}

export default function FloatingDock() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { theme, toggleTheme, setCommandPaletteOpen } = useUIStore()
  const mouseX = useMotionValue(Infinity)

  const items: DockEntry[] = [
    {
      id: 'home',
      label: '博客首页',
      icon: <FiHome size={16} />,
      isActive: location.pathname === '/',
      onClick: () => navigate('/'),
    },
    {
      id: 'archive',
      label: '发现文章',
      icon: <FiCompass size={16} />,
      isActive:
        location.pathname.startsWith('/search') ||
        location.pathname.startsWith('/category') ||
        location.pathname.startsWith('/tag'),
      onClick: () => navigate('/search'),
    },
    {
      id: 'series',
      label: '系列专栏',
      icon: <FiBookOpen size={16} />,
      isActive: location.pathname.startsWith('/series'),
      onClick: () => navigate('/series'),
    },
    {
      id: 'search',
      label: '搜索 ⌘K',
      icon: <FiSearch size={16} />,
      hideOnMobile: true,
      onClick: () => setCommandPaletteOpen(true),
    },
    {
      id: 'write',
      label: '写文章',
      icon: <FiEdit3 size={16} />,
      isActive: location.pathname.startsWith('/editor'),
      onClick: () => navigate(isAuthenticated ? '/editor' : '/login'),
    },
    ...(isAuthenticated
      ? [
          {
            id: 'drafts',
            label: '我的内容',
            icon: <FiFileText size={16} />,
            isActive: location.pathname.startsWith('/my-content'),
            onClick: () => navigate('/my-content?tab=drafts'),
          },
          {
            id: 'messages',
            label: '站内私信',
            icon: <FiMail size={16} />,
            isActive: location.pathname.startsWith('/messages'),
            onClick: () => navigate('/messages'),
          },
        ]
      : []),
    {
      id: 'theme',
      label: theme === 'dark' ? '切换浅色' : '切换夜间',
      icon: theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />,
      onClick: toggleTheme,
    },
  ]

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-3 pointer-events-none">
      <motion.nav
        data-hide-cursor="true"
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        onMouseMove={(e) => {
          if (window.matchMedia('(hover: hover)').matches) {
            mouseX.set(e.clientX)
          }
        }}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="pointer-events-auto overflow-visible flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-full bg-[#FAF8F4]/90 dark:bg-[#191817]/90 backdrop-blur-2xl border border-white/75 dark:border-white/10 shadow-dock"
      >
        {items.map((item) => (
          <DockIconButton key={item.id} item={item} mouseX={mouseX} />
        ))}
      </motion.nav>
    </div>
  )
}
