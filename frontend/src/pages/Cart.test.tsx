import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { useAuth } from '../context/AuthContext'
import type { CartItem } from '../types'
import Cart from './Cart'

vi.mock('axios', () => ({
  default: {
    isAxiosError: vi.fn()
  }
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}))

const mockedIsAxiosError = vi.mocked(axios.isAxiosError)
const mockedUseAuth = vi.mocked(useAuth)
const authGet = vi.fn()
const authPost = vi.fn()
const authPut = vi.fn()
const authDelete = vi.fn()
const authAxios = { get: authGet, post: authPost, put: authPut, delete: authDelete }

const item: CartItem = {
  productId: 1,
  qty: 2,
  product: { id: 1, title: 'Producto A', price: 9.99, stock: 10 }
}

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  authGet.mockReset()
  authPost.mockReset()
  authPut.mockReset()
  authDelete.mockReset()
  mockedUseAuth.mockReturnValue({
    authAxios,
    user: { id: 1, username: 'alice' },
    authReady: true
  } as unknown as ReturnType<typeof useAuth>)
  authGet.mockResolvedValue({ data: [] })
})

function renderCart() {
  return render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  )
}

describe('Cart page', () => {
  it('shows login actions to unauthenticated visitors', () => {
    mockedUseAuth.mockReturnValue({
      authAxios,
      user: null,
      authReady: true
    } as unknown as ReturnType<typeof useAuth>)

    renderCart()

    expect(screen.getByRole('heading', { name: 'Carrito', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute('href', '/login')
    expect(authGet).not.toHaveBeenCalled()
  })

  it('loads items, updates quantity and removes an item', async () => {
    authGet.mockReset()
    authGet
      .mockResolvedValueOnce({ data: [item] })
      .mockResolvedValueOnce({ data: [item] })
      .mockResolvedValueOnce({ data: [] })
    authPut.mockResolvedValueOnce({ data: { ok: true } })
    authDelete.mockResolvedValueOnce({ data: { ok: true } })

    renderCart()
    expect(await screen.findByRole('heading', { name: item.product!.title })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /aumentar cantidad/i }))
    await waitFor(() => expect(authPut).toHaveBeenCalledWith('/api/cart', {
      productId: item.productId,
      qty: 3
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(authDelete).toHaveBeenCalledWith('/api/cart/1'))
    expect(await screen.findByRole('heading', { name: /carrito está vacío/i })).toBeInTheDocument()
  })

  it('retries a failed load and completes a checkout', async () => {
    authGet.mockReset()
    authGet
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: [] })
    renderCart()

    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos cargar tu carrito/i)
    fireEvent.click(screen.getByRole('button', { name: /volver a intentar/i }))
    expect(await screen.findByRole('heading', { name: /carrito está vacío/i })).toBeInTheDocument()

    cleanup()
    authGet.mockReset().mockResolvedValueOnce({ data: [item] })
    authPost
      .mockResolvedValueOnce({ data: { order: { id: 42, status: 'pending_payment' } } })
      .mockResolvedValueOnce({ data: { order: { id: 42, status: 'paid' } } })
    renderCart()
    await screen.findByRole('heading', { name: item.product!.title })
    fireEvent.click(screen.getByRole('button', { name: /pagar ahora/i }))
    await waitFor(() => expect(authPost).toHaveBeenNthCalledWith(
      1,
      '/api/checkout',
      undefined,
      { headers: { 'Idempotency-Key': expect.any(String) } }
    ))
    expect(authPost).toHaveBeenNthCalledWith(
      2,
      '/api/orders/42/pay',
      { outcome: 'paid' }
    )
    expect(await screen.findByText(/compra simulada completada/i)).toBeInTheDocument()
  })

  it('reports quantity, remove and checkout failures', async () => {
    authGet.mockReset().mockResolvedValue({ data: [item] })
    authPut.mockRejectedValueOnce(new Error('update failed'))
    authDelete.mockRejectedValueOnce(new Error('delete failed'))
    authPost
      .mockRejectedValueOnce({ response: { data: { error: 'Insufficient stock for Producto A' } } })
      .mockResolvedValueOnce({ data: { order: { id: 7, status: 'pending_payment' } } })
      .mockRejectedValueOnce(new Error('payment failed'))
    mockedIsAxiosError.mockReturnValueOnce(true).mockReturnValueOnce(false)

    renderCart()
    await screen.findByRole('heading', { name: item.product!.title })

    fireEvent.click(screen.getByRole('button', { name: /aumentar cantidad/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos actualizar/i)

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos eliminar/i)

    fireEvent.click(screen.getByRole('button', { name: /pagar ahora/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/suficiente stock/i)

    fireEvent.click(screen.getByRole('button', { name: /pagar ahora/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/pedido.*pago.*pendiente/i)
  })
})
