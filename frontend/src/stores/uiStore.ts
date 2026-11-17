import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ReaderFontSize = 'sm' | 'md' | 'lg'
export type ReaderFontFamily = 'sans' | 'serif'
export type AmbientMood = 'default' | 'sage' | 'clay' | 'slate' | 'ochre' | 'plum'
export type PaperTint = 'oat' | 'sage' | 'parchment' | 'porcelain'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  paperTint: PaperTint
  commandPaletteOpen: boolean
  readerFontSize: ReaderFontSize
  readerFontFamily: ReaderFontFamily
  ambientMood: AmbientMood

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setPaperTint: (tint: PaperTint) => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setReaderFontSize: (size: ReaderFontSize) => void
  setReaderFontFamily: (family: ReaderFontFamily) => void
  setAmbientMood: (mood: AmbientMood) => void
}

const applyThemeToDOM = (theme: 'light' | 'dark', paperTint?: PaperTint) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    if (paperTint) {
      root.dataset.paperTint = paperTint
    }
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      theme: 'light',
      paperTint: 'oat',
      commandPaletteOpen: false,
      readerFontSize: 'md',
      readerFontFamily: 'serif',
      ambientMood: 'default',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => {
        applyThemeToDOM(theme, get().paperTint)
        set({ theme })
      },
      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light'
        applyThemeToDOM(nextTheme, get().paperTint)
        set({ theme: nextTheme })
      },
      setPaperTint: (paperTint) => {
        applyThemeToDOM(get().theme, paperTint)
        set({ paperTint })
      },
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setReaderFontSize: (readerFontSize) => set({ readerFontSize }),
      setReaderFontFamily: (readerFontFamily) => set({ readerFontFamily }),
      setAmbientMood: (ambientMood) => set({ ambientMood }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        paperTint: state.paperTint,
        readerFontSize: state.readerFontSize,
        readerFontFamily: state.readerFontFamily,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme, state.paperTint || 'oat')
        }
      },
    }
  )
)

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('ui-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.state?.theme === 'dark') {
        document.documentElement.classList.add('dark')
      }
      if (parsed?.state?.paperTint) {
        document.documentElement.dataset.paperTint = parsed.state.paperTint
      }
    }
  } catch {
    // ignore storage parse error
  }
}
