import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'
import OfflineIndicator from '../OfflineIndicator'
import CommandPalette from '../editorial/CommandPalette'
import AmbientAurora from '../editorial/AmbientAurora'
import MagneticCursor from '../editorial/MagneticCursor'
import FloatingDock from '../editorial/FloatingDock'
import { useUIStore } from '@/stores/uiStore'

export default function Layout() {
  const location = useLocation()
  const setAmbientMood = useUIStore((s) => s.setAmbientMood)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    setAmbientMood('default')
  }, [location.pathname, setAmbientMood])

  return (
    <div className="min-h-screen flex flex-col relative bg-paper-100 dark:bg-ink-900 text-ink-800 dark:text-ink-50 transition-colors duration-700 pb-28">
      {/* Dynamic Morandi Mood Wash */}
      <AmbientAurora />

      {/* Magnetic Follower Cursor */}
      <MagneticCursor />

      {/* Top Header */}
      <Header />

      {/*
        IMPORTANT: Animate opacity ONLY (no AnimatePresence mode="wait", no filter/transform)
        so React Router <Outlet /> never deadlocks layoutId children and position:fixed
        descendants (ReadingProgressBar, BlogDetail side capsule, modals) anchor to viewport.
      */}
      <main className="flex-1 w-full max-w-[1480px] mx-auto px-5 sm:px-8 lg:px-12 pt-4 pb-20 relative z-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      <Footer />

      {/* Bottom Floating Frosted Linen-Glass Dock */}
      <FloatingDock />

      <CommandPalette />
      <OfflineIndicator />
    </div>
  )
}
