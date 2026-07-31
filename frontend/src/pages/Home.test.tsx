import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import { AuthProvider } from '../context/AuthContext'

vi.mock('axios', () => {
  const axios = {
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
  return { default: axios }
})

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
})
