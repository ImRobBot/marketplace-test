import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { useAuth } from '../context/AuthContext'
import type { Product as ProductData } from '../types'
import Product from './Product'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    isAxiosError: vi.fn()
  }
}))

vi.mock('../context/AuthContext', () => ({
  API_BASE_URL: 'http://localhost:4000',
  useAuth: vi.fn()
}))

const mockedGet = vi.mocked(axios.get)
const mockedIsAxiosError = vi.mocked(axios.isAxiosError)
const mockedUseAuth = vi.mocked(useAuth)
const authPost = vi.fn()

const product: ProductData = {
  id: 1,
  title: 'Producto A',
  price: 9.99,
  stock: 5,
  description: 'Producto para pruebas'
}

const authAxios = { post: authPost }

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    authAxios,
    user: { id: 1, username: 'alice' },
    authReady: true
  } as unknown as ReturnType<typeof useAuth>)
})

function renderProduct(initialEntries: string[] = ['/product/1']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/product/:id" element={<Product />} />
        <Route path="/" element={<p>Catálogo</p>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Product page', () => {
  it('loads a product, changes quantity and adds it to the cart', async () => {
    mockedGet.mockResolvedValueOnce({ data: product } as never)
    authPost.mockResolvedValueOnce({ data: { ok: true } })

    renderProduct()

    expect(screen.getByLabelText('Cargando producto')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: product.title })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /añadir al carrito/i }))

    await waitFor(() => expect(authPost).toHaveBeenCalledWith('/api/cart', {
      productId: product.id,
      qty: 3
    }))
    expect(screen.getByRole('status')).toHaveTextContent(/añadido al carrito/i)
  })

  it('reports an error when adding the product fails and supports unauthenticated users', async () => {
    mockedGet.mockResolvedValueOnce({ data: product } as never)
    authPost.mockRejectedValueOnce(new Error('offline'))

    renderProduct()
    await screen.findByRole('heading', { name: product.title })
    fireEvent.click(screen.getByRole('button', { name: /añadir al carrito/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos actualizar/i)

    cleanup()
    mockedGet.mockResolvedValueOnce({ data: product } as never)
    mockedUseAuth.mockReturnValue({
      authAxios,
      user: null,
      authReady: true
    } as unknown as ReturnType<typeof useAuth>)
    renderProduct()
    await screen.findByRole('heading', { name: product.title })
    expect(screen.getByRole('link', { name: /inicia sesión para comprar/i })).toHaveAttribute(
      'href',
      '/login'
    )
  })

  it('shows the not-found and generic API error states', async () => {
    mockedIsAxiosError.mockReturnValue(true)
    mockedGet.mockRejectedValueOnce({ response: { status: 404 } })

    renderProduct()
    expect(await screen.findByRole('heading', { name: /no encontramos el producto/i })).toBeInTheDocument()
    expect(screen.getByText(/no está disponible/i)).toBeInTheDocument()

    cleanup()
    mockedIsAxiosError.mockReturnValue(false)
    mockedGet.mockRejectedValueOnce(new Error('server error'))
    renderProduct()
    expect(await screen.findByText(/no pudimos cargar el producto/i)).toBeInTheDocument()
  })

  it('handles a missing product id without calling the API', () => {
    render(
      <MemoryRouter>
        <Product />
      </MemoryRouter>
    )

    expect(screen.getByText(/el producto que buscas no existe/i)).toBeInTheDocument()
    expect(mockedGet).not.toHaveBeenCalled()
  })
})
