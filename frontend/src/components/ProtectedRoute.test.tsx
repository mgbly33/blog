import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute'
import { useAuthStore } from '@/stores/authStore'

// Mock useAuthStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

describe('ProtectedRoute', () => {
  it('renders Outlet when authenticated', () => {
    // Mock authenticated state
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
    } as any)

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<div data-testid="protected-content">受保护内容</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('protected-content')).toBeDefined()
  })

  it('redirects to /login when not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
    } as any)

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<div>受保护内容</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">登录页</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('login-page')).toBeDefined()
  })
})
