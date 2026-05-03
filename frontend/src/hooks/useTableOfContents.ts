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
export function useTableOfContents(contentRef: React.RefObject<HTMLElement | null>) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [readingProgress, setReadingProgress] = useState(0)

  // 从 DOM 中提取标题
  useEffect(() => {
    if (!contentRef.current) return

    const observer = new MutationObserver(() => {
      extractHeadings()
    })

    const extractHeadings = () => {
      if (!contentRef.current) return
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4')
      const items: TocItem[] = Array.from(headings).map((heading, index) => {
        // 给标题添加 id 以便锚点跳转
        const id = heading.id || `heading-${index}`
        if (!heading.id) heading.id = id

        return {
          id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.charAt(1)),
        }
      })
      setToc(items)
    }

    // 初始提取
    extractHeadings()

    // 监听 DOM 变化（Markdown 渲染完成后）
    observer.observe(contentRef.current, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [contentRef])

  // 追踪滚动位置 → 高亮当前标题 + 阅读进度
  const handleScroll = useCallback(() => {
    // 计算阅读进度
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
    const progress = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 0
    setReadingProgress(progress)

    // 查找当前可见的标题
    if (toc.length === 0) return

    let currentId = toc[0]?.id || ''
    for (const item of toc) {
      const element = document.getElementById(item.id)
      if (element) {
        const rect = element.getBoundingClientRect()
        if (rect.top <= 100) {
          currentId = item.id
        }
      }
    }
    setActiveId(currentId)
  }, [toc])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  return { toc, activeId, readingProgress, scrollToHeading }
}
