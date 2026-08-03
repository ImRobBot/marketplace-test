import { Link } from 'react-router-dom'
import ProductVisual from '../product/ProductVisual'
import { formatPrice, getProductDescription, getProductMeta } from '../../lib/products'
import type { Product } from '../../types'

interface ProductCardProps {
  product: Product
  authenticated: boolean
  adding: boolean
  onAdd: (product: Product) => void
}

export default function ProductCard({
  product,
  authenticated,
  adding,
  onAdd
}: ProductCardProps) {
  const meta = getProductMeta(product.id)
  const outOfStock = product.stock <= 0

  return (
    <article className="product-card">
      <Link
        className="product-card__visual-link"
        to={`/product/${product.id}`}
        aria-label={`Ver ${product.title}`}
      >
        <ProductVisual product={product} />
      </Link>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{meta.category}</span>
          <span className={`stock-badge${outOfStock ? ' stock-badge--empty' : ''}`}>
            {outOfStock ? 'Agotado' : 'Disponible'}
          </span>
        </div>
        <h3><Link to={`/product/${product.id}`}>{product.title}</Link></h3>
        <p className="product-card__description">{getProductDescription(product)}</p>
        <div className="product-card__availability">
          <span aria-hidden="true">✓</span>
          {outOfStock ? 'Temporalmente sin existencias' : `${product.stock} unidades en inventario`}
        </div>
        <div className="product-card__footer">
          <div className="price-block">
            <strong>{formatPrice(product.price)}</strong>
            <span>MXN</span>
          </div>
          {authenticated ? (
            <button
              className="button button--compact"
              type="button"
              disabled={outOfStock || adding}
              aria-label={`Añadir ${product.title} al carrito`}
              onClick={() => onAdd(product)}
            >
              {adding ? 'Añadiendo…' : 'Añadir al carrito'}
            </button>
          ) : (
            <Link
              className="button button--compact button--secondary"
              to="/login"
              state={{ from: '/' }}
            >
              Ingresa para comprar
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
