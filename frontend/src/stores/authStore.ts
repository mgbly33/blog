import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

const normalizeUser = (incomingUser: User, previousUser?: User | null): User => {
  const isAdmin =
    incomingUser.isAdmin ??
    (incomingUser.role ? incomingUser.role === 'ADMIN' : undefined) ??
    previousUser?.isAdmin ??
    (previousUser?.role === 'ADMIN')

  return {
    ...previousUser,
    ...incomingUser,
    role: incomingUser.role ?? (isAdmin ? 'ADMIN' : 'USER'),
    isAdmin: Boolean(isAdmin),
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setUser: (user) =>
        set((state) => ({
          user: normalizeUser(user, state.user),
        })),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      login: (user, accessToken, refreshToken) =>
        set({
          user: normalizeUser(user),
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
