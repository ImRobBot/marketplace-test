import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { AuthProvider, useAuth } from './AuthContext'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    create: vi.fn(() => ({
      interceptors: { request: { use: vi.fn() } },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }))
  }
}))

const mockedPost = vi.mocked(axios.post)
const mockedCreate = vi.mocked(axios.create)

function ContextProbe() {
  const { user, token, login, register, logout } = useAuth()

  return (
    <>
      <output data-testid="user">{user?.username ?? 'none'}</output>
      <output data-testid="token">{token ?? 'none'}</output>
      <button type="button" onClick={() => void login('alice', 'secret123456')}>Login</button>
      <button type="button" onClick={() => void register('bob', 'secret123456')}>Register</button>
      <button type="button" onClick={logout}>Logout</button>
    </>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <ContextProbe />
    </AuthProvider>
  )
}

afterEach(cleanup)

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('AuthContext', () => {
  it('loads valid persisted credentials and discards malformed users', () => {
    localStorage.setItem('token', 'persisted-token')
    localStorage.setItem('user', '{malformed-json')

    renderProvider()

    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(screen.getByTestId('token')).toHaveTextContent('persisted-token')

    cleanup()
    localStorage.setItem('user', JSON.stringify({ id: 3, username: 'carol' }))
    renderProvider()

    expect(screen.getByTestId('user')).toHaveTextContent('carol')
  })

  it('persists login and registration responses and supports logout', async () => {
    mockedPost
      .mockResolvedValueOnce({
        data: { token: 'login-token', user: { id: 1, username: 'alice' } }
      } as never)
      .mockResolvedValueOnce({
        data: { token: 'register-token', user: { id: 2, username: 'bob' } }
      } as never)

    renderProvider()

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('login-token'))
    expect(localStorage.getItem('user')).toContain('alice')

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('bob'))
    expect(localStorage.getItem('token')).toBe('register-token')

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('none'))
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('adds the bearer token through the axios request interceptor', () => {
    localStorage.setItem('token', 'interceptor-token')
    renderProvider()

    const created = mockedCreate.mock.results[0]?.value as {
      interceptors: { request: { use: { mock: { calls: unknown[][] } } } }
    }
    const requestUse = created.interceptors.request.use
    const interceptor = requestUse.mock.calls[0]?.[0] as (
      config: { headers: Record<string, string> }
    ) => { headers: Record<string, string> }

    expect(interceptor({ headers: {} }).headers.Authorization).toBe('Bearer interceptor-token')
  })

  it('requires AuthProvider when useAuth is called', () => {
    expect(() => render(<ContextProbe />)).toThrow('useAuth debe usarse dentro de AuthProvider')
  })
})
