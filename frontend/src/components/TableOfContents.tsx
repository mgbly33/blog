import { motion } from 'framer-motion'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  toc: TocItem[]
  activeId: string
  progress?: number
  onClickHeading: (id: string) => void
}

export default function TableOfContents({
  toc,
  activeId,
  progress = 0,
  onClickHeading,
}: TableOfContentsProps) {
  if (toc.length === 0) return null

  const minLevel = Math.min(...toc.map((item) => item.level))

  return (
    <div className="sticky top-28 select-none">
      <div className="rounded-3xl bg-[#FAF8F4]/80 dark:bg-[#191817]/85 backdrop-blur-2xl border border-hairline-light dark:border-hairline-dark p-4 shadow-editorial">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-xs font-semibold text-ink-500 dark:text-ink-300">
            文章大纲
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-vermilion/10 text-vermilion font-editorial-mono text-[10px] font-medium">
            {Math.round(progress)}%
          </span>
        </div>

        <nav className="space-y-0.5 max-h-[62vh] overflow-y-auto no-scrollbar">
          {toc.map((item) => {
            const isActive = activeId === item.id
            const indent = Math.max(0, item.level - minLevel) * 10 + 10

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onClickHeading(item.id)}
                style={{ paddingLeft: `${indent}px` }}
                title={item.text}
                className={`relative block w-full text-left py-1.5 pr-3 rounded-xl text-xs leading-snug truncate transition-colors ${
                  isActive
                    ? 'text-vermilion font-semibold'
                    : 'text-ink-400 hover:text-ink-800 dark:hover:text-ink-100'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="toc-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-vermilion/10 dark:bg-vermilion/15 -z-10"
                  />
                )}
                {item.text}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
