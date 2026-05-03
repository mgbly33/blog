import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { historyApi } from '@/api/history'

interface UseReadProgressOptions {
  blogId: string | undefined
  enabled?: boolean
  debounceMs?: number
}

export function useReadProgress({ blogId, enabled = true, debounceMs = 3000 }: UseReadProgressOptions) {
  const { isAuthenticated } = useAuthStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastProgressRef = useRef<number>(0)
  const lastScrollRef = useRef<number>(0)

  const reportProgress = useCallback(() => {
    if (!blogId || !isAuthenticated) return

    const progress = lastProgressRef.current
    const scrollPosition = lastScrollRef.current

    historyApi.updateProgress(blogId, progress, scrollPosition).catch(() => {
      // Silent failure: do not interrupt reading.
    })
  }, [blogId, isAuthenticated])

  const reportProgressOnUnload = useCallback(() => {
    if (!blogId || !isAuthenticated) return

    historyApi.updateProgressKeepalive(blogId, lastProgressRef.current, lastScrollRef.current)
  }, [blogId, isAuthenticated])

  useEffect(() => {
    if (!enabled || !blogId || !isAuthenticated) return

    const calculateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const progress = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 0

      lastProgressRef.current = progress
      lastScrollRef.current = scrollTop

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(reportProgress, debounceMs)
    }

    window.addEventListener('scroll', calculateProgress, { passive: true })
    window.addEventListener('beforeunload', reportProgressOnUnload)

    return () => {
      window.removeEventListener('scroll', calculateProgress)
      window.removeEventListener('beforeunload', reportProgressOnUnload)
      if (timerRef.current) clearTimeout(timerRef.current)
      reportProgressOnUnload()
    }
  }, [enabled, blogId, isAuthenticated, debounceMs, reportProgress, reportProgressOnUnload])

  return {
    progress: lastProgressRef.current,
  }
}
