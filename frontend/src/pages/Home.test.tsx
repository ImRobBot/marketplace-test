import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import { AuthProvider } from '../context/AuthContext'

vi.mock('axios', () => {
  const axios = {
    get: vi.fn().mockResolvedValue({
      data: [
        { id: 1, title: 'Producto A', price: 9.99, stock: 10 },
        { id: 2, title: 'Producto B', price: 19.99, stock: 5 }
      ]
    }),
    create: vi.fn(() => ({
      interceptors: { request: { use: vi.fn() } },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }))
  }
  return { default: axios }
})

afterEach(cleanup)

describe('Home page', () => {
  it('renders products from the API', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(await screen.findByText(/Producto A/i)).toBeInTheDocument()
  })

  it('filters the catalog using the search query from the URL', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/?q=Producto%20B']}>
          <Home />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(await screen.findByRole('heading', { name: 'Producto B' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Producto A' })).not.toBeInTheDocument()
    })
  })
})
