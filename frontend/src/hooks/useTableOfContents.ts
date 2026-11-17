import { useState, useEffect, useCallback } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

/**
 * 从 Markdown 内容中提取标题生成 TOC
 * 同时追踪阅读进度和当前高亮标题
 */
export function useTableOfContents(
  contentRef: React.RefObject<HTMLElement | null>,
  contentKey?: string | number | null
) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [readingProgress, setReadingProgress] = useState(0)

  useEffect(() => {
    if (!contentRef.current) {
      setToc([])
      return
    }

    const extractHeadings = () => {
      if (!contentRef.current) return
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4')
      const items: TocItem[] = Array.from(headings).map((heading, index) => {
        const id = heading.id || `heading-${index}`
        if (!heading.id) heading.id = id

        return {
          id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.charAt(1), 10),
        }
      })
      setToc(items)
      if (items.length > 0) {
        setActiveId((prev) => prev || items[0].id)
      }
    }

    extractHeadings()

    const observer = new MutationObserver(() => {
      extractHeadings()
    })

    observer.observe(contentRef.current, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [contentRef, contentKey])

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
    const progress = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 0
    setReadingProgress(progress)

    if (toc.length === 0) return

    let currentId = toc[0]?.id || ''
    for (const item of toc) {
      const element = document.getElementById(item.id)
      if (element) {
        const rect = element.getBoundingClientRect()
        if (rect.top <= 120) {
          currentId = item.id
        }
      }
    }
    setActiveId(currentId)
  }, [toc])

  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 88
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  return { toc, activeId, readingProgress, scrollToHeading }
}
