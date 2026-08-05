import { Link } from 'react-router-dom'
import { getCartProduct, getMaximumStock } from '../../lib/cart'
import { formatPrice } from '../../lib/products'
import type { CartItem } from '../../types'
import ProductVisual from '../product/ProductVisual'
import QuantityControl from './QuantityControl'

interface CartItemCardProps {
  item: CartItem
  pendingAction: string
  onRemove: (productId: number, title: string) => void
  onQuantityChange: (productId: number, quantity: number) => void
}

export default function CartItemCard({
  item,
  pendingAction,
  onRemove,
  onQuantityChange
}: Readonly<CartItemCardProps>) {
  const product = getCartProduct(item)
  const quantityBusy = pendingAction === `quantity-${item.productId}`
  const removeBusy = pendingAction === `remove-${item.productId}`

  return (
    <article className="cart-item">
      <Link
        className="cart-item__visual"
        to={`/product/${item.productId}`}
        aria-label={`Ver ${product.title}`}
      >
        <ProductVisual product={product} compact />
      </Link>
      <div className="cart-item__info">
        <span className="cart-item__eyebrow">Selección Mercado Uno</span>
        <h2><Link to={`/product/${item.productId}`}>{product.title}</Link></h2>
        <span className="cart-item__unit-price">
          {formatPrice(product.price)} por unidad
        </span>
        <button
          className="text-button text-button--danger"
          type="button"
          disabled={removeBusy}
          onClick={() => onRemove(item.productId, product.title)}
        >
          {removeBusy ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
      <div className="cart-item__controls">
        <QuantityControl
          title={product.title}
          quantity={item.qty}
          maxStock={getMaximumStock(product)}
          busy={quantityBusy}
          onChange={quantity => onQuantityChange(item.productId, quantity)}
        />
        <strong className="cart-item__subtotal">
          {formatPrice(Number(product.price) * item.qty)}
        </strong>
      </div>
    </article>
  )
}
