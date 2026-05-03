import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { draftApi, SaveDraftRequest } from '@/api/draft'

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'failed' | 'offline'

interface UseAutoSaveOptions {
  draftId?: string
  blogId?: string
  debounceMs?: number
  enabled?: boolean
  onSaveSuccess?: (draftId: string) => void
  onSaveError?: (error: Error) => void
}

interface UseAutoSaveReturn {
  status: SaveStatus
  lastSavedAt: Date | null
  draftId: string | null
  save: (data: SaveDraftRequest) => void
  saveImmediately: (data: SaveDraftRequest) => Promise<void>
}

export function useAutoSave(options: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const {
    draftId: initialDraftId,
    blogId,
    debounceMs = 3000,
    enabled = true,
    onSaveSuccess,
    onSaveError,
  } = options

  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(initialDraftId || null)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDataRef = useRef<SaveDraftRequest | null>(null)
  const lastSavedContentRef = useRef<string>('')

  // Check online status
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update status when offline
  useEffect(() => {
    if (!isOnline && status !== 'offline') {
      setStatus('offline')
    }
  }, [isOnline, status])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: SaveDraftRequest) => {
      if (currentDraftId) {
        return draftApi.updateDraft(currentDraftId, data)
      }
      return draftApi.saveDraft({ ...data, blogId })
    },
    onSuccess: (response) => {
      const draft = response.data
      const draftId = String(draft.id)
      setCurrentDraftId(draftId)
      setLastSavedAt(new Date())
      setStatus('saved')
      lastSavedContentRef.current = JSON.stringify(pendingDataRef.current)
      onSaveSuccess?.(draftId)
    },
    onError: (error) => {
      setStatus('failed')
      onSaveError?.(error as Error)
    },
  })

  // Debounced save function
  const save = useCallback(
    (data: SaveDraftRequest) => {
      if (!enabled) return

      // Store pending data
      pendingDataRef.current = data

      // Check if content has changed
      const currentContent = JSON.stringify(data)
      if (currentContent === lastSavedContentRef.current) {
        return // No changes, skip save
      }

      // Set pending status
      setStatus('pending')

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        if (!isOnline) {
          setStatus('offline')
          // Store in localStorage for later sync
          localStorage.setItem('pendingDraft', JSON.stringify(data))
          return
        }

        setStatus('saving')
        saveMutation.mutate(data)
      }, debounceMs)
    },
    [enabled, debounceMs, isOnline, saveMutation]
  )

  // Immediate save function
  const saveImmediately = useCallback(
    async (data: SaveDraftRequest) => {
      if (!enabled) return

      pendingDataRef.current = data

      if (!isOnline) {
        setStatus('offline')
        localStorage.setItem('pendingDraft', JSON.stringify(data))
        return
      }

      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      setStatus('saving')
      await saveMutation.mutateAsync(data)
    },
    [enabled, isOnline, saveMutation]
  )

  // Process pending saves when coming back online
  useEffect(() => {
    if (isOnline && status === 'offline') {
      const pendingDraft = localStorage.getItem('pendingDraft')
      if (pendingDraft) {
        try {
          const data = JSON.parse(pendingDraft)
          setStatus('saving')
          saveMutation.mutate(data)
          localStorage.removeItem('pendingDraft')
        } catch {
          localStorage.removeItem('pendingDraft')
        }
      }
    }
  }, [isOnline, status, saveMutation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    status,
    lastSavedAt,
    draftId: currentDraftId,
    save,
    saveImmediately,
  }
}
