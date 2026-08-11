import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { AuthProvider, useAuth } from './AuthContext'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
  }
}))

const mockedPost = vi.mocked(axios.post)
const mockedGet = vi.mocked(axios.get)
const mockedCreate = vi.mocked(axios.create)

function ContextProbe() {
  const { user, authReady, login, register, logout } = useAuth()

  return (
    <>
      <output data-testid="user">{user?.username ?? 'none'}</output>
      <output data-testid="ready">{authReady ? 'ready' : 'loading'}</output>
      <button type="button" onClick={() => void login('alice', 'secret123456')}>Login</button>
      <button type="button" onClick={() => void register('bob', 'secret123456')}>Register</button>
      <button type="button" onClick={() => void logout()}>Logout</button>
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
  it('restores the session from the HttpOnly cookie through /me', async () => {
    localStorage.setItem('token', 'legacy-token-must-be-ignored')
    mockedGet.mockResolvedValueOnce({
      data: { user: { id: 3, username: 'carol' } }
    } as never)
    renderProvider()

    expect(await screen.findByTestId('user')).toHaveTextContent('carol')
    expect(screen.getByTestId('ready')).toHaveTextContent('ready')
    expect(mockedGet).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/me',
      { withCredentials: true }
    )
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('uses credentialed cookie requests for login, registration and logout', async () => {
    mockedGet.mockRejectedValueOnce(new Error('no session'))
    mockedPost
      .mockResolvedValueOnce({
        data: { user: { id: 1, username: 'alice' } }
      } as never)
      .mockResolvedValueOnce({
        data: { user: { id: 2, username: 'bob' } }
      } as never)
      .mockResolvedValueOnce({ data: { ok: true } } as never)

    renderProvider()

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice'))
    expect(mockedPost).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/login',
      { username: 'alice', password: 'secret123456' },
      { withCredentials: true }
    )

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('bob'))
    expect(localStorage.getItem('token')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
    expect(mockedPost).toHaveBeenLastCalledWith(
      'http://localhost:4000/api/auth/logout',
      {},
      { withCredentials: true }
    )
  })

  it('creates an API client that always includes browser credentials', () => {
    mockedGet.mockRejectedValueOnce(new Error('no session'))
    renderProvider()

    expect(mockedCreate).toHaveBeenCalledWith({
      baseURL: 'http://localhost:4000',
      withCredentials: true
    })
  })

  it('requires AuthProvider when useAuth is called', () => {
    expect(() => render(<ContextProbe />)).toThrow('useAuth debe usarse dentro de AuthProvider')
  })
})
