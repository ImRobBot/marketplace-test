import type { Product } from '../types'

const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2
})

const productThemes = [
  { theme: 'sage', category: 'Esencial diario' },
  { theme: 'clay', category: 'Selección especial' },
  { theme: 'ink', category: 'Diseño funcional' },
  { theme: 'sun', category: 'Nuevo favorito' }
] as const

export interface ProductMeta {
  theme: (typeof productThemes)[number]['theme']
  category: string
  code: string
}

type ProductDescription = Pick<Product, 'description'>

export function formatPrice(value: number | string | null | undefined): string {
  const amount = Number(value)
  return priceFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function getProductMeta(id: number | string | null | undefined): ProductMeta {
  const numericId = Math.max(1, Math.trunc(Math.abs(Number(id))) || 1)
  const meta = productThemes[(numericId - 1) % productThemes.length] ?? productThemes[0]

  return {
    ...meta,
    code: String(numericId).padStart(2, '0')
  }
}

export function getProductDescription(product: ProductDescription | null | undefined): string {
  return product?.description?.trim()
    || 'Una pieza versátil seleccionada por su utilidad, sencillez y diseño honesto.'
}
