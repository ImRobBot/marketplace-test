import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import ProductVisual from '../components/ProductVisual'
import { API_BASE_URL, useAuth } from '../context/AuthContext'
import { formatPrice, getProductDescription, getProductMeta } from '../lib/products'
import type { Feedback, Product as ProductData } from '../types'

export default function Product() {
  const { id } = useParams<{ id: string }>()
  const { authAxios, token } = useAuth()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    if (!id) {
      setProduct(null)
      setError('El producto que buscas no existe.')
      setLoading(false)
      return
    }

    axios.get<ProductData>(`${API_BASE_URL}/api/products/${id}`)
      .then(response => {
        if (active) setProduct(response.data)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        const notFound = axios.isAxiosError(requestError) && requestError.response?.status === 404
        setError(notFound
          ? 'Este producto ya no está disponible.'
          : 'No pudimos cargar el producto. Inténtalo de nuevo más tarde.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [id])

  const addToCart = async (selectedProduct: ProductData): Promise<void> => {
    setAdding(true)
    setFeedback(null)
    try {
      await authAxios.post('/api/cart', { productId: selectedProduct.id, qty: quantity })
      setFeedback({
        type: 'success',
        message: `${quantity} × ${selectedProduct.title} añadido al carrito.`
      })
    } catch {
      setFeedback({ type: 'error', message: 'No pudimos actualizar el carrito. Inténtalo de nuevo.' })
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <section
        className="page-shell page-section product-detail product-detail--loading"
        aria-busy="true"
      >
        <div className="skeleton skeleton--detail-visual" />
        <div className="product-detail__content">
          <div className="skeleton skeleton--line-short" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line-medium" />
        </div>
      </section>
    )
  }

  if (error || !product) {
    return (
      <section className="page-shell empty-state page-section">
        <span className="empty-state__icon" aria-hidden="true">!</span>
        <h1>No encontramos el producto</h1>
        <p>{error || 'El producto que buscas no existe.'}</p>
        <Link className="button" to="/">Volver al catálogo</Link>
      </section>
    )
  }

  const meta = getProductMeta(product.id)
  const outOfStock = product.stock <= 0

  return (
    <div className="page-shell page-section">
      <Link className="back-link" to="/"><span aria-hidden="true">←</span> Volver al catálogo</Link>

      <section className="product-detail" aria-labelledby="product-title">
        <div className="product-detail__visual">
          <ProductVisual product={product} />
        </div>

        <div className="product-detail__content">
          <div className="product-detail__meta">
            <span className="eyebrow">{meta.category}</span>
            <span className={`stock-badge${outOfStock ? ' stock-badge--empty' : ''}`}>
              {outOfStock ? 'Sin stock' : `${product.stock} en stock`}
            </span>
          </div>
          <h1 id="product-title">{product.title}</h1>
          <p className="product-detail__description">{getProductDescription(product)}</p>

          <div className="product-detail__price">
            <strong>{formatPrice(product.price)}</strong>
            <span>MXN · impuestos incluidos</span>
          </div>

          <div className="product-detail__purchase">
            {token ? (
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
                    onChange={event => {
                      const nextValue = Number(event.target.value)
                      setQuantity(Math.min(
                        Math.max(nextValue || 1, 1),
                        Math.max(product.stock, 1)
                      ))
                    }}
                  />
                </label>
                <button
                  className="button button--wide"
                  type="button"
                  disabled={outOfStock || adding}
                  onClick={() => addToCart(product)}
                >
                  {adding ? 'Añadiendo…' : outOfStock ? 'Producto agotado' : 'Añadir al carrito'}
                </button>
              </>
            ) : (
              <Link className="button button--wide" to="/login" state={{ from: `/product/${id}` }}>
                Inicia sesión para comprar
              </Link>
            )}
          </div>

          {feedback && (
            <div
              className={`notice notice--${feedback.type}`}
              role={feedback.type === 'error' ? 'alert' : 'status'}
            >
              <span>{feedback.message}</span>
              {feedback.type === 'success' && <Link to="/cart">Ver carrito</Link>}
            </div>
          )}

          <dl className="product-facts">
            <div>
              <dt>Disponibilidad</dt>
              <dd>{outOfStock ? 'Agotado temporalmente' : 'Lista para agregar'}</dd>
            </div>
            <div><dt>Referencia</dt><dd>MU-{meta.code}</dd></div>
            <div><dt>Tipo de compra</dt><dd>Demostración sin cargo</dd></div>
          </dl>
        </div>
      </section>
    </div>
  )
}
