import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'

export default function MagneticCursor() {
  const location = useLocation()
  const [cursorLabel, setCursorLabel] = useState<string | null>(null)
  const [suppressed, setSuppressed] = useState(false)
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)
  const [isFinePointer, setIsFinePointer] = useState(false)

  const rawX = useMotionValue(-100)
  const rawY = useMotionValue(-100)

  const x = useSpring(rawX, { stiffness: 420, damping: 32, mass: 0.35 })
  const y = useSpring(rawY, { stiffness: 420, damping: 32, mass: 0.35 })

  useEffect(() => {
    setCursorLabel(null)
  }, [location.pathname, location.search])

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    setIsFinePointer(mq.matches)
    if (!mq.matches) return

    const handleMove = (e: MouseEvent) => {
      rawX.set(e.clientX)
      rawY.set(e.clientY)
      if (!visibleRef.current) {
        visibleRef.current = true
        setVisible(true)
      }

      const target = e.target as HTMLElement | null
      if (target?.closest?.('[data-hide-cursor]')) {
        setSuppressed(true)
        setCursorLabel(null)
        return
      }
      setSuppressed(false)

      const cursorEl = target?.closest?.('[data-cursor]') as HTMLElement | null
      const attr = cursorEl?.getAttribute('data-cursor')
      if (attr) {
        setCursorLabel(attr)
      } else {
        setCursorLabel(null)
      }
    }

    const handleClearLabel = () => setCursorLabel(null)
    const handleLeave = () => {
      visibleRef.current = false
      setVisible(false)
      setCursorLabel(null)
    }

    window.addEventListener('mousemove', handleMove, { passive: true })
    window.addEventListener('mousedown', handleClearLabel, { passive: true })
    window.addEventListener('scroll', handleClearLabel, { passive: true })
    document.addEventListener('mouseleave', handleLeave)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mousedown', handleClearLabel)
      window.removeEventListener('scroll', handleClearLabel)
      document.removeEventListener('mouseleave', handleLeave)
    }
  }, [rawX, rawY])

  if (!isFinePointer) return null

  const isExpanded = Boolean(cursorLabel)
  const showDot = visible && !suppressed

  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className="fixed top-0 left-0 z-[9998] pointer-events-none -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center"
    >
      <motion.div
        animate={{
          width: isExpanded ? 74 : 8,
          height: isExpanded ? 74 : 8,
          opacity: showDot ? 1 : 0,
          scale: showDot ? 1 : 0.4,
        }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        className={`rounded-full flex items-center justify-center transition-colors duration-300 ${
          isExpanded
            ? 'bg-[#1C1B19]/90 dark:bg-[#F2EFE9]/95 text-[#FAF8F4] dark:text-[#111110] backdrop-blur-md shadow-editorial-float border border-white/15 dark:border-ink-900/15'
            : 'bg-vermilion/70 dark:bg-[#C89B7B]/85'
        }`}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.16 }}
              className="text-[11px] font-medium tracking-wider whitespace-nowrap"
            >
              {cursorLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
