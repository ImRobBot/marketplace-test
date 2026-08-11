import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { AuthProvider } from '../context/AuthContext'
import Login from './Login'
import NotFound from './NotFound'
import Register from './Register'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }))
  }
}))

const mockedPost = vi.mocked(axios.post)
const mockedGet = vi.mocked(axios.get)
const mockedIsAxiosError = vi.mocked(axios.isAxiosError)

afterEach(cleanup)

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  mockedGet.mockRejectedValue(new Error('no active session'))
})

function renderAuthPage(page: React.ReactNode, initialEntries: string[] = ['/login']) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={page} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<p>Destino carrito</p>} />
          <Route path="/" element={<p>Destino inicio</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

function submitForm(buttonName: string) {
  const button = screen.getByRole('button', { name: buttonName })
  fireEvent.submit(button.closest('form') as HTMLFormElement)
}

describe('authentication pages', () => {
  it('logs in with trimmed username and honors the previous route', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { user: { id: 1, username: 'alice' } }
    } as never)

    renderAuthPage(<Login />, ['/login'])
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: ' alice ' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123456' } })
    submitForm('Entrar')

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/login',
      { username: 'alice', password: 'secret123456' },
      { withCredentials: true }
    ))
    expect(await screen.findByText('Destino inicio')).toBeInTheDocument()
  })

  it('shows a useful login error when the request fails', async () => {
    mockedPost.mockRejectedValueOnce(new Error('invalid credentials'))

    renderAuthPage(<Login />)
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'alice' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'wrong-password' } })
    submitForm('Entrar')

    expect(await screen.findByRole('alert')).toHaveTextContent(/usuario o la contraseña/i)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).not.toBeDisabled())
  })

  it('registers a user and navigates to the home page', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { user: { id: 2, username: 'bob' } }
    } as never)

    renderAuthPage(<Register />, ['/register'])
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: ' bob ' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123456' } })
    submitForm('Crear cuenta')

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/register',
      { username: 'bob', password: 'secret123456' },
      { withCredentials: true }
    ))
    expect(await screen.findByText('Destino inicio')).toBeInTheDocument()
  })

  it('explains the password policy before sending an invalid registration', async () => {
    renderAuthPage(<Register />, ['/register'])
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'bob' } })
    fireEvent.change(screen.getByLabelText(/contrase/i), { target: { value: 'short' } })
    submitForm('Crear cuenta')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La contraseña debe tener entre 12 y 128 caracteres.'
    )
    expect(mockedPost).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/contrase/i)).toHaveAttribute('minLength', '12')
    expect(screen.getByLabelText(/contrase/i)).toHaveAttribute('maxLength', '128')
  })

  it('distinguishes an existing username from a generic registration error', async () => {
    mockedIsAxiosError.mockReturnValue(true)
    mockedPost.mockRejectedValueOnce({ response: { data: { error: 'User exists' } } })

    renderAuthPage(<Register />, ['/register'])
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'bob' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123456' } })
    submitForm('Crear cuenta')
    expect(await screen.findByRole('alert')).toHaveTextContent(/ya está en uso/i)

    cleanup()
    mockedPost.mockRejectedValueOnce({ response: { data: { error: 'Validation failed' } } })
    renderAuthPage(<Register />, ['/register'])
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'bob' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret123456' } })
    submitForm('Crear cuenta')
    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos crear la cuenta/i)
  })

  it('renders the not-found state', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /página no está/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver a explorar/i })).toHaveAttribute('href', '/')
  })
})
