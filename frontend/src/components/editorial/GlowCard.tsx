import { useRef, type ReactNode } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'

interface GlowCardProps {
  children: ReactNode
  className?: string
  delay?: number
  tilt?: boolean
}

export default function GlowCard({
  children,
  className = '',
  delay = 0,
  tilt = true,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const normX = useMotionValue(0.5)
  const normY = useMotionValue(0.5)

  const springConfig = { stiffness: 240, damping: 26, mass: 0.6 }
  const rotateX = useSpring(useTransform(normY, [0, 1], [2.2, -2.2]), springConfig)
  const rotateY = useSpring(useTransform(normX, [0, 1], [-2.2, 2.2]), springConfig)

  const spotlightBg = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(184, 151, 120, 0.13), rgba(184, 196, 180, 0.06) 45%, transparent 80%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mouseX.set(x)
    mouseY.set(y)
    normX.set(x / rect.width)
    normY.set(y / rect.height)
  }

  const handleMouseLeave = () => {
    normX.set(0.5)
    normY.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        tilt
          ? {
              rotateX,
              rotateY,
              transformPerspective: 1200,
            }
          : undefined
      }
      className={`group relative overflow-hidden rounded-[22px] bg-[#FAF8F4]/80 dark:bg-[#191817]/75 backdrop-blur-2xl border border-hairline-light dark:border-hairline-dark shadow-editorial hover:shadow-editorial-hover transition-shadow duration-500 ${className}`}
    >
      <motion.div
        aria-hidden
        style={{ background: spotlightBg }}
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
      />
      <div className="relative z-10 h-full flex flex-col justify-between">
        {children}
      </div>
    </motion.div>
  )
}
