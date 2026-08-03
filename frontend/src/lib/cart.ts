import type { CartItem, ProductPreview } from '../types'

export interface CartSummary {
  units: number
  total: number
}

export function calculateCartSummary(items: readonly CartItem[]): CartSummary {
  return items.reduce<CartSummary>((summary, item) => {
    const quantity = Number(item.qty || 0)
    summary.units += quantity
    summary.total += Number(item.product?.price || 0) * quantity
    return summary
  }, { units: 0, total: 0 })
}

export function getCartProduct(item: CartItem): ProductPreview {
  return item.product ?? {
    id: item.productId,
    title: `Producto ${item.productId}`,
    price: 0
  }
}

export function getMaximumStock(product: ProductPreview): number {
  const stock = Number(product.stock)
  return Number.isFinite(stock) ? stock : Infinity
}
