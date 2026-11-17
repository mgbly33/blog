import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useUIStore, type AmbientMood } from '@/stores/uiStore'

const MOOD_COLORS: Record<AmbientMood, { a: string; b: string }> = {
  default: {
    a: 'rgba(212, 198, 176, 0.36)',
    b: 'rgba(190, 198, 186, 0.28)',
  },
  sage: {
    a: 'rgba(166, 188, 160, 0.44)',
    b: 'rgba(208, 216, 198, 0.34)',
  },
  clay: {
    a: 'rgba(212, 172, 150, 0.44)',
    b: 'rgba(226, 204, 184, 0.34)',
  },
  slate: {
    a: 'rgba(168, 184, 198, 0.44)',
    b: 'rgba(204, 212, 220, 0.32)',
  },
  ochre: {
    a: 'rgba(216, 194, 152, 0.45)',
    b: 'rgba(202, 178, 148, 0.32)',
  },
  plum: {
    a: 'rgba(194, 174, 190, 0.42)',
    b: 'rgba(214, 196, 188, 0.32)',
  },
}

/**
 * Warm Fog Museum Ambient Light & Dynamic Morandi Mood Wash
 */
export default function AmbientAurora() {
  const { ambientMood } = useUIStore()
  const palette = MOOD_COLORS[ambientMood] || MOOD_COLORS.default

  const mouseX = useMotionValue(-600)
  const mouseY = useMotionValue(-600)
  const smoothX = useSpring(mouseX, { stiffness: 45, damping: 30, mass: 1 })
  const smoothY = useSpring(mouseY, { stiffness: 45, damping: 30, mass: 1 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 300)
      mouseY.set(e.clientY - 300)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [mouseX, mouseY])

  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Primary Morandi Mood Wash Top-Right */}
      <motion.div
        animate={{ backgroundColor: palette.a }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-40 right-[-8rem] w-[48rem] h-[48rem] rounded-full blur-[145px] opacity-75 dark:opacity-20"
      />

      {/* Secondary Morandi Mood Wash Bottom-Left */}
      <motion.div
        animate={{ backgroundColor: palette.b }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-44 -left-28 w-[50rem] h-[44rem] rounded-full blur-[150px] opacity-75 dark:opacity-18"
      />

      {/* Subtle Warm Sunlight Cursor Diffusion */}
      <motion.div
        style={{ x: smoothX, y: smoothY }}
        className="hidden lg:block w-[600px] h-[600px] rounded-full blur-[110px] opacity-40 dark:opacity-15"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(196, 164, 136, 0.25) 0%, rgba(184, 196, 180, 0.12) 50%, transparent 72%)',
          }}
        />
      </motion.div>
    </div>
  )
}
