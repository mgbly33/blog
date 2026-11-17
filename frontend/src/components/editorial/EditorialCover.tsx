import { useState } from 'react'
import { motion } from 'framer-motion'

interface EditorialCoverProps {
  src?: string | null
  title?: string | null
  summary?: string | null
  seed?: string | number
  category?: string | null
  aspectClass?: string
  roundedClass?: string
  className?: string
  compact?: boolean
  badgeText?: string
  curtainReveal?: boolean
  cursorLabel?: string | null
}

function hashSeed(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

/**
 * 6 Bespoke Museum & Publication Art Palettes (Kinfolk / Stripe Press / Readymag inspired)
 */
const ART_PALETTES = [
  {
    name: 'TERRACOTTA SOLSTICE',
    bg: 'from-[#F2EBE0] via-[#E8DDD0] to-[#F7F3EC] dark:from-[#26211D] dark:via-[#1D1916] dark:to-[#2B2520]',
    glowA: 'bg-[#C68B6B]/40',
    glowB: 'bg-[#E2C6A8]/45',
    stroke: '#9E6B52',
    fillSoft: 'rgba(158, 107, 82, 0.14)',
    accentText: 'text-[#8C5A3C] dark:text-[#D9AA8B]',
  },
  {
    name: 'BOTANICAL CELADON',
    bg: 'from-[#E5EDE3] via-[#D8E3D5] to-[#F1F5F0] dark:from-[#1C241E] dark:via-[#161D18] dark:to-[#232D25]',
    glowA: 'bg-[#7A9A75]/35',
    glowB: 'bg-[#BED0B9]/45',
    stroke: '#567352',
    fillSoft: 'rgba(86, 115, 82, 0.14)',
    accentText: 'text-[#486344] dark:text-[#A4C39E]',
  },
  {
    name: 'NORDIC FJORD SLATE',
    bg: 'from-[#E4EBF2] via-[#D7E1EB] to-[#F1F5F8] dark:from-[#1B2229] dark:via-[#151B21] dark:to-[#222B34]',
    glowA: 'bg-[#7794AD]/35',
    glowB: 'bg-[#B9CCDC]/45',
    stroke: '#4B6982',
    fillSoft: 'rgba(75, 105, 130, 0.14)',
    accentText: 'text-[#425D75] dark:text-[#9BB8D0]',
  },
  {
    name: 'AMBER PARCHMENT',
    bg: 'from-[#F2EAD9] via-[#E8DEC7] to-[#F8F4EC] dark:from-[#28231A] dark:via-[#1F1B14] dark:to-[#2F291E]',
    glowA: 'bg-[#C4A166]/35',
    glowB: 'bg-[#E3CFA8]/45',
    stroke: '#8F6E38',
    fillSoft: 'rgba(143, 110, 56, 0.14)',
    accentText: 'text-[#7D5E2D] dark:text-[#D8BA84]',
  },
  {
    name: 'VELVET DUSK MAUVE',
    bg: 'from-[#EFE6E9] via-[#E4D7DC] to-[#F7F2F4] dark:from-[#271F23] dark:via-[#1E171B] dark:to-[#2E2429]',
    glowA: 'bg-[#B58392]/35',
    glowB: 'bg-[#DABCC5]/45',
    stroke: '#825260',
    fillSoft: 'rgba(130, 82, 96, 0.14)',
    accentText: 'text-[#754654] dark:text-[#D1A6B3]',
  },
  {
    name: 'ARCHITECTURAL OBSIDIAN',
    bg: 'from-[#EAE9E3] via-[#DFDDD5] to-[#F4F3EF] dark:from-[#23221F] dark:via-[#1A1917] dark:to-[#2A2925]',
    glowA: 'bg-[#8E8C7A]/35',
    glowB: 'bg-[#C7C5B8]/45',
    stroke: '#5E5C4E',
    fillSoft: 'rgba(94, 92, 78, 0.14)',
    accentText: 'text-[#525043] dark:text-[#BDBCAC]',
  },
]

function GenerativeArtSvg({
  variant,
  stroke,
  fillSoft,
}: {
  variant: number
  stroke: string
  fillSoft: string
}) {
  switch (variant % 6) {
    case 0:
      // Solar Orbit & Golden Ratio Rings
      return (
        <svg
          viewBox="0 0 320 200"
          fill="none"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-75 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
        >
          <circle cx="240" cy="70" r="54" fill={fillSoft} stroke={stroke} strokeWidth="0.9" strokeOpacity="0.45" />
          <circle cx="240" cy="70" r="82" stroke={stroke} strokeWidth="0.7" strokeDasharray="3 3" strokeOpacity="0.35" />
          <circle cx="205" cy="95" r="32" fill={fillSoft} stroke={stroke} strokeWidth="0.8" strokeOpacity="0.4" />
          <line x1="20" y1="70" x2="300" y2="70" stroke={stroke} strokeWidth="0.6" strokeOpacity="0.22" />
          <line x1="240" y1="10" x2="240" y2="190" stroke={stroke} strokeWidth="0.6" strokeOpacity="0.22" />
          <circle cx="240" cy="70" r="4" fill={stroke} fillOpacity="0.55" />
        </svg>
      )
    case 1:
      // Bauhaus Overlapping Arch & Moon
      return (
        <svg
          viewBox="0 0 320 200"
          fill="none"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-75 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
        >
          <path
            d="M185 180 V88 A48 48 0 0 1 281 88 V180 Z"
            fill={fillSoft}
            stroke={stroke}
            strokeWidth="0.9"
            strokeOpacity="0.45"
          />
          <circle cx="205" cy="64" r="28" fill={fillSoft} stroke={stroke} strokeWidth="0.9" strokeOpacity="0.5" />
          <rect x="150" y="110" width="64" height="64" rx="8" stroke={stroke} strokeWidth="0.7" strokeOpacity="0.3" />
        </svg>
      )
    case 2:
      // Topographic Horizon Waves
      return (
        <svg
          viewBox="0 0 320 200"
          fill="none"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-75 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
        >
          <circle cx="250" cy="56" r="26" fill={fillSoft} stroke={stroke} strokeWidth="0.9" strokeOpacity="0.45" />
          <path
            d="M0 135 Q 85 95, 165 130 T 320 115"
            stroke={stroke}
            strokeWidth="1"
            strokeOpacity="0.4"
          />
          <path
            d="M0 155 Q 95 115, 175 148 T 320 135"
            stroke={stroke}
            strokeWidth="0.8"
            strokeOpacity="0.3"
          />
          <path
            d="M0 175 Q 105 135, 185 166 T 320 155"
            stroke={stroke}
            strokeWidth="0.6"
            strokeOpacity="0.22"
          />
        </svg>
      )
    case 3:
      // Swiss International Perspective Grid & Prism
      return (
        <svg
          viewBox="0 0 320 200"
          fill="none"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-75 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
        >
          <rect x="172" y="28" width="112" height="112" rx="18" fill={fillSoft} stroke={stroke} strokeWidth="0.85" strokeOpacity="0.4" />
          <rect x="196" y="52" width="112" height="112" rx="18" stroke={stroke} strokeWidth="0.75" strokeDasharray="4 4" strokeOpacity="0.35" />
          <line x1="172" y1="28" x2="284" y2="140" stroke={stroke} strokeWidth="0.6" strokeOpacity="0.28" />
          <circle cx="228" cy="84" r="18" fill={fillSoft} stroke={stroke} strokeWidth="0.9" strokeOpacity="0.5" />
        </svg>
      )
    case 4:
      // Botanical Eclipse & Sacred Geometry
      return (
        <svg
          viewBox="0 0 320 200"
          fill="none"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-75 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
        >
          <ellipse cx="235" cy="90" rx="68" ry="34" transform="rotate(-28 235 90)" fill={fillSoft} stroke={stroke} strokeWidth="0.85" strokeOpacity="0.42" />
          <ellipse cx="235" cy="90" rx="68" ry="34" transform="rotate(28 235 90)" fill={fillSoft} stroke={stroke} strokeWidth="0.85" strokeOpacity="0.42" />
          <circle cx="235" cy="90" r="16" stroke={stroke} strokeWidth="0.9" strokeOpacity="0.55" />
        </svg>
      )
    default:
      // Isometric Compass & Architectural Coordinates
      return (
        <svg
          viewBox="0 0 320 200"
          fill="none"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-75 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
        >
          <polygon
            points="235,24 295,84 235,144 175,84"
            fill={fillSoft}
            stroke={stroke}
            strokeWidth="0.9"
            strokeOpacity="0.45"
          />
          <circle cx="235" cy="84" r="36" stroke={stroke} strokeWidth="0.75" strokeOpacity="0.38" />
          <line x1="155" y1="84" x2="315" y2="84" stroke={stroke} strokeWidth="0.6" strokeOpacity="0.25" />
        </svg>
      )
  }
}

export default function EditorialCover({
  src,
  title,
  summary,
  seed = '',
  category,
  aspectClass = 'aspect-[16/10]',
  roundedClass = 'rounded-[20px]',
  className = '',
  compact = false,
  badgeText,
  curtainReveal = true,
  cursorLabel,
}: EditorialCoverProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const safeTitle = (title || '博客文章').trim() || '博客文章'
  const h = hashSeed(`${seed}-${safeTitle}`)
  const palette = ART_PALETTES[h % ART_PALETTES.length]
  const issueNum = String((Number(seed) || (h % 89) + 1)).padStart(2, '0')

  const hasValidImage = Boolean(src && !imgFailed)
  const cursorProps = cursorLabel ? { 'data-cursor': cursorLabel } : {}

  const content = hasValidImage ? (
    <div
      {...cursorProps}
      className={`relative overflow-hidden ${roundedClass} bg-paper-200 dark:bg-ink-800 ${aspectClass} ${className}`}
    >
      <motion.img
        src={src!}
        alt={safeTitle}
        loading="lazy"
        onError={() => setImgFailed(true)}
        initial={curtainReveal ? { scale: 1.04 } : false}
        whileInView={curtainReveal ? { scale: 1.0 } : undefined}
        viewport={{ once: true, margin: '0px' }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full object-cover film-grade group-hover:scale-[1.04]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60 group-hover:opacity-35 transition-opacity duration-500"
      />
      {!compact && (badgeText || category) && (
        <div className="pointer-events-none absolute top-3.5 left-3.5 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#FAF8F4]/90 dark:bg-[#191817]/90 text-ink-800 dark:text-ink-100 backdrop-blur-md shadow-sm">
            {badgeText || category}
          </span>
        </div>
      )}
    </div>
  ) : (
    <div
      {...cursorProps}
      className={`relative overflow-hidden select-none ${roundedClass} bg-gradient-to-br ${palette.bg} border border-hairline-light dark:border-hairline-dark ${aspectClass} ${className}`}
    >
      {/* Ambient Morandi Light Orbs */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full blur-2xl ${palette.glowA} transition-transform duration-700 ease-out group-hover:scale-125`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full blur-2xl ${palette.glowB} transition-transform duration-700 ease-out group-hover:scale-125`}
      />

      {/* Bespoke Generative SVG Art Plate */}
      <GenerativeArtSvg variant={h} stroke={palette.stroke} fillSoft={palette.fillSoft} />

      {/* Architectural Frame Border */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-xl border border-ink-800/[0.06] dark:border-white/[0.06]"
      />

      {!compact ? (
        <div className="relative z-10 h-full p-5 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#FAF8F4]/80 dark:bg-white/[0.08] text-ink-800 dark:text-ink-100 backdrop-blur-md border border-white/50 dark:border-white/10">
              {badgeText || category || '精选文章'}
            </span>
            <span
              className={`font-editorial-mono text-[10px] tracking-[0.2em] uppercase opacity-75 ${palette.accentText}`}
            >
              NO. {issueNum}
            </span>
          </div>

          <div className="space-y-2 max-w-[88%]">
            <p className="font-editorial-serif text-xl sm:text-2xl font-semibold text-ink-900 dark:text-ink-50 leading-snug line-clamp-2 group-hover:translate-x-1 transition-transform duration-500">
              {safeTitle}
            </p>
            {summary && (
              <p className="text-xs text-ink-600 dark:text-ink-300 line-clamp-1 opacity-90">
                {summary}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-1.5">
          <span className={`font-editorial-serif italic text-lg font-bold leading-none ${palette.accentText}`}>
            {(safeTitle[0] || '文').toUpperCase()}
          </span>
          <span className="font-editorial-mono text-[8px] tracking-widest opacity-55 mt-0.5 text-ink-600 dark:text-ink-300">
            №{issueNum}
          </span>
        </div>
      )}
    </div>
  )

  if (!curtainReveal || compact) return content

  return (
    <motion.div
      initial={{ opacity: 0.9, scale: 0.99 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '0px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {content}
    </motion.div>
  )
}
