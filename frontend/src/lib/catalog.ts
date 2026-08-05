import { getProductMeta } from './products'
import type { Product } from '../types'

export function filterProducts(products: readonly Product[], query: string): Product[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return [...products]

  return products.filter(product => {
    const meta = getProductMeta(product.id)
    return `${product.title} ${product.description || ''} ${meta.category}`
      .toLowerCase()
      .includes(normalizedQuery)
  })
}
