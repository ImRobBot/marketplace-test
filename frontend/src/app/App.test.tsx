import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import App from './App'
import SiteHeader from '../components/layout/SiteHeader'
import { AuthProvider } from '../context/AuthContext'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: [{ id: 1, title: 'Producto A', price: 9.99, stock: 10 }]
    }),
    create: vi.fn(() => ({
      interceptors: { request: { use: vi.fn() } },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }))
  }
}))

afterEach(cleanup)

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.mocked(axios.get).mockResolvedValue({
    data: [{ id: 1, title: 'Producto A', price: 9.99, stock: 10 }]
  } as never)
})

describe('application shell', () => {
  it('renders the routed application shell and catalog', async () => {
    render(<App />)

    expect(screen.getByRole('link', { name: /saltar al contenido/i })).toHaveAttribute(
      'href',
      '#main-content'
    )
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Producto A' })).toBeInTheDocument()
  })

  it('renders the signed-in header and logs the user out', async () => {
    localStorage.setItem('token', 'token')
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'alice' }))

    render(
      <AuthProvider>
        <BrowserRouter>
          <SiteHeader />
        </BrowserRouter>
      </AuthProvider>
    )

    expect(screen.getByText('Hola, alice')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    await waitFor(() => expect(screen.getByText('Hola, ingresa')).toBeInTheDocument())
  })
})
