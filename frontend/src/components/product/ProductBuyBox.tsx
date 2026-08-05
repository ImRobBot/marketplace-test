import { Link } from 'react-router-dom'
import FeedbackNotice from '../common/FeedbackNotice'
import { formatPrice } from '../../lib/products'
import { clampQuantity } from '../../lib/quantity'
import type { Feedback, Product } from '../../types'

interface ProductBuyBoxProps {
  product: Product
  productId?: string
  authenticated: boolean
  outOfStock: boolean
  quantity: number
  adding: boolean
  feedback: Feedback | null
  onQuantityChange: (quantity: number) => void
  onAdd: (product: Product) => void
}

function getAddButtonLabel(adding: boolean, outOfStock: boolean): string {
  if (adding) return 'Añadiendo…'
  if (outOfStock) return 'Producto agotado'
  return 'Añadir al carrito'
}

export default function ProductBuyBox({
  product,
  productId,
  authenticated,
  outOfStock,
  quantity,
  adding,
  feedback,
  onQuantityChange,
  onAdd
}: Readonly<ProductBuyBoxProps>) {
  return (
    <aside className="product-buy-box" aria-label="Opciones de compra">
      <div className="product-detail__price">
        <strong>{formatPrice(product.price)}</strong>
        <span>MXN · impuestos incluidos</span>
      </div>
      <span className={`stock-badge${outOfStock ? ' stock-badge--empty' : ''}`}>
        {outOfStock ? 'Sin stock' : 'Disponible'}
      </span>
      <p className="buy-box__message">
        {outOfStock
          ? 'Este producto no se puede añadir por el momento.'
          : `${product.stock} unidades disponibles para esta demostración.`}
      </p>

      <div className="product-detail__purchase">
        {authenticated ? (
          <>
            <label className="quantity-field" htmlFor="quantity">
              <span>Cantidad</span>
              <input
                id="quantity"
                type="number"
                min="1"
                max={Math.max(product.stock, 1)}
                value={quantity}
                disabled={outOfStock}
                onChange={event => onQuantityChange(clampQuantity(event.target.value, product.stock))}
              />
            </label>
            <button
              className="button button--wide"
              type="button"
              disabled={outOfStock || adding}
              onClick={() => onAdd(product)}
            >
              {getAddButtonLabel(adding, outOfStock)}
            </button>
          </>
        ) : (
          <Link className="button button--wide" to="/login" state={{ from: `/product/${productId}` }}>
            Inicia sesión para comprar
          </Link>
        )}
      </div>

      <FeedbackNotice
        feedback={feedback}
        actionLabel={feedback?.type === 'success' ? 'Ver carrito' : undefined}
        actionTo={feedback?.type === 'success' ? '/cart' : undefined}
      />

      <ul className="buy-box__assurances">
        <li><span aria-hidden="true">✓</span> Precio visible antes de confirmar</li>
        <li><span aria-hidden="true">✓</span> Checkout totalmente simulado</li>
      </ul>
    </aside>
  )
}
