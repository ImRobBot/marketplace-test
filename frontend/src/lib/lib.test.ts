import { describe, expect, it } from 'vitest'

import { getRedirectTarget } from './auth'
import { calculateCartSummary, getCartProduct, getMaximumStock } from './cart'
import { filterProducts } from './catalog'
import { createIdempotencyKey } from './idempotency'
import { clampQuantity } from './quantity'
import { formatPrice, getProductDescription, getProductMeta } from './products'
import type { Product } from '../types'

const products: Product[] = [
  { id: 1, title: 'Lámpara', price: 100, stock: 4, description: 'Luz para casa' },
  { id: 2, title: 'Taza', price: '25.50', stock: 0, description: null }
]

describe('domain utilities', () => {
  it('validates redirect targets', () => {
    expect(getRedirectTarget({ from: '/cart' })).toBe('/cart')
    expect(getRedirectTarget({ from: 'https://evil.example' })).toBe('/')
    expect(getRedirectTarget({ from: '//evil.example' })).toBe('/')
    expect(getRedirectTarget({ from: '/\\evil.example' })).toBe('/')
    expect(getRedirectTarget(null)).toBe('/')
    expect(getRedirectTarget({})).toBe('/')
  })

  it('creates idempotency keys from cryptographically secure randomness', () => {
    const uuidCrypto = {
      randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
    } as unknown as Crypto
    expect(createIdempotencyKey(uuidCrypto)).toBe('123e4567-e89b-12d3-a456-426614174000')

    const byteCrypto = {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.set(Array.from({ length: bytes.length }, (_, index) => index))
        return bytes
      }
    } as unknown as Crypto
    expect(createIdempotencyKey(byteCrypto)).toBe(
      'checkout-000102030405060708090a0b0c0d0e0f'
    )
  })

  it('fails closed when secure randomness is unavailable', () => {
    expect(() => createIdempotencyKey(null)).toThrow(
      'Secure random generation is unavailable'
    )
  })

  it('calculates cart summaries and product fallbacks', () => {
    expect(calculateCartSummary([
      { productId: 1, qty: 2, product: products[0] },
      { productId: 2, qty: 1, product: null },
    ])).toEqual({ units: 3, total: 200 })

    expect(getCartProduct({ productId: 7, qty: 1 })).toEqual({
      id: 7,
      title: 'Producto 7',
      price: 0
    })
    expect(getMaximumStock(products[0]!)).toBe(4)
    expect(getMaximumStock({ id: 2, title: 'Sin stock', price: 0 })).toBe(Infinity)
  })

  it('filters products by title, description and category', () => {
    expect(filterProducts(products, '')).toEqual(products)
    expect(filterProducts(products, 'luz')).toEqual([products[0]])
    expect(filterProducts(products, 'especial')).toEqual([products[1]])
    expect(filterProducts(products, 'not-found')).toEqual([])
  })

  it('clamps quantities to the supported stock range', () => {
    expect(clampQuantity('', 5)).toBe(1)
    expect(clampQuantity('3', 5)).toBe(3)
    expect(clampQuantity(9, 5)).toBe(5)
    expect(clampQuantity(-2, 0)).toBe(1)
  })

  it('formats prices and normalizes product metadata', () => {
    expect(formatPrice(25.5)).toContain('25.50')
    expect(formatPrice('not-a-number')).toContain('0.00')
    expect(getProductMeta(0).code).toBe('01')
    expect(getProductMeta(5).code).toBe('05')
    expect(getProductMeta(undefined).category).toBeTruthy()
    expect(getProductDescription({ description: '  Descripción propia  ' })).toBe('Descripción propia')
    expect(getProductDescription({ description: ' ' })).toContain('Una pieza')
    expect(getProductDescription(null)).toContain('Una pieza')
  })
})
