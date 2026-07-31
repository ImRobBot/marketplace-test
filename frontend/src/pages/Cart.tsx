import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import ProductVisual from '../components/ProductVisual'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../lib/products'
import type { ApiErrorResponse, CartItem, Feedback, ProductPreview } from '../types'

interface CartSummary {
  units: number
  total: number
}

export default function Cart() {
  const { authAxios, token } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const load = useCallback(async (showLoading = true): Promise<void> => {
    if (!token) {
      setItems([])
      setLoading(false)
      return
    }

    if (showLoading) setLoading(true)
    setError('')
    try {
      const response = await authAxios.get<CartItem[]>('/api/cart')
      setItems(response.data)
    } catch {
      setError('No pudimos cargar tu carrito. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [authAxios, token])

  useEffect(() => {
    void load()
  }, [load])

  const remove = async (productId: number, title: string): Promise<void> => {
    setPendingAction(`remove-${productId}`)
    setFeedback(null)
    try {
      await authAxios.delete(`/api/cart/${productId}`)
      setFeedback({ type: 'success', message: `${title} se eliminó del carrito.` })
      await load(false)
    } catch {
      setFeedback({ type: 'error', message: 'No pudimos eliminar el producto.' })
    } finally {
      setPendingAction('')
    }
  }

  const updateQuantity = async (productId: number, quantity: number): Promise<void> => {
    setPendingAction(`quantity-${productId}`)
    setFeedback(null)
    try {
      await authAxios.put('/api/cart', { productId, qty: quantity })
      await load(false)
    } catch {
      setFeedback({ type: 'error', message: 'No pudimos actualizar la cantidad.' })
    } finally {
      setPendingAction('')
    }
  }

  const checkout = async (): Promise<void> => {
    setPendingAction('checkout')
    setFeedback(null)
    try {
      await authAxios.post('/api/checkout')
      setFeedback({
        type: 'success',
        message: '¡Compra simulada completada! Tu carrito quedó listo para empezar de nuevo.'
      })
      setItems([])
    } catch (checkoutError: unknown) {
      const insufficientStock = axios.isAxiosError<ApiErrorResponse>(checkoutError)
        && checkoutError.response?.data.error?.includes('Insufficient stock')
      setFeedback({
        type: 'error',
        message: insufficientStock
          ? 'Uno de los productos ya no tiene suficiente stock. Actualiza las cantidades.'
          : 'No pudimos completar la compra simulada. Inténtalo de nuevo.'
      })
    } finally {
      setPendingAction('')
    }
  }

  const summary = useMemo(() => items.reduce<CartSummary>((result, item) => {
    const price = Number(item.product?.price || 0)
    result.units += Number(item.qty || 0)
    result.total += price * Number(item.qty || 0)
    return result
  }, { units: 0, total: 0 }), [items])

  return (
    <div className="page-shell page-section cart-page">
      <div className="section-heading section-heading--cart">
        <div>
          <span className="eyebrow">Tu selección</span>
          <h1>Carrito</h1>
          <p>
            {token
              ? `${summary.units} ${summary.units === 1 ? 'artículo' : 'artículos'} en tu compra`
              : 'Inicia sesión para ver tus productos'}
          </p>
        </div>
        <Link className="back-link" to="/"><span aria-hidden="true">←</span> Seguir explorando</Link>
      </div>

      {feedback && (
        <div
          className={`notice notice--${feedback.type}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          <span>{feedback.message}</span>
        </div>
      )}

      {!token && (
        <div className="empty-state empty-state--bordered cart-auth-state">
          <span className="empty-state__icon" aria-hidden="true">M</span>
          <h2>Tu carrito te está esperando</h2>
          <p>Ingresa a tu cuenta para guardar productos y continuar con la compra simulada.</p>
          <div className="empty-state__actions">
            <Link className="button" to="/login" state={{ from: '/cart' }}>Iniciar sesión</Link>
            <Link className="button button--secondary" to="/register">Crear cuenta</Link>
          </div>
        </div>
      )}

      {token && loading && (
        <div className="cart-layout" aria-busy="true">
          <div className="cart-list">
            {[1, 2].map(item => <div className="skeleton skeleton--cart-item" key={item} />)}
          </div>
          <div className="skeleton skeleton--summary" />
        </div>
      )}

      {token && !loading && error && (
        <div className="empty-state empty-state--bordered" role="alert">
          <span className="empty-state__icon" aria-hidden="true">!</span>
          <h2>No pudimos abrir el carrito</h2>
          <p>{error}</p>
          <button className="button" type="button" onClick={() => load()}>Volver a intentar</button>
        </div>
      )}

      {token && !loading && !error && items.length === 0 && (
        <div className="empty-state empty-state--bordered">
          <span className="empty-state__icon empty-state__icon--bag" aria-hidden="true" />
          <h2>Tu carrito está vacío</h2>
          <p>Explora la colección y guarda aquí tus productos favoritos.</p>
          <Link className="button" to="/">Descubrir productos</Link>
        </div>
      )}

      {token && !loading && !error && items.length > 0 && (
        <div className="cart-layout">
          <section className="cart-list" aria-label="Productos en el carrito">
            {items.map(item => {
              const product: ProductPreview = item.product ?? {
                id: item.productId,
                title: `Producto ${item.productId}`,
                price: 0
              }
              const quantityBusy = pendingAction === `quantity-${item.productId}`
              const removeBusy = pendingAction === `remove-${item.productId}`
              const parsedStock = Number(product.stock)
              const maxStock = Number.isFinite(parsedStock) ? parsedStock : Infinity

              return (
                <article className="cart-item" key={item.productId}>
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
                      onClick={() => remove(item.productId, product.title)}
                    >
                      {removeBusy ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </div>
                  <div className="cart-item__controls">
                    <span className="quantity-control__label">Cantidad</span>
                    <div className="quantity-control" aria-label={`Cantidad de ${product.title}`}>
                      <button
                        type="button"
                        aria-label={`Reducir cantidad de ${product.title}`}
                        disabled={item.qty <= 1 || quantityBusy}
                        onClick={() => updateQuantity(item.productId, item.qty - 1)}
                      >−</button>
                      <output aria-live="polite">{item.qty}</output>
                      <button
                        type="button"
                        aria-label={`Aumentar cantidad de ${product.title}`}
                        disabled={item.qty >= maxStock || quantityBusy}
                        onClick={() => updateQuantity(item.productId, item.qty + 1)}
                      >+</button>
                    </div>
                    <strong className="cart-item__subtotal">
                      {formatPrice(Number(product.price) * item.qty)}
                    </strong>
                  </div>
                </article>
              )
            })}
          </section>

          <aside className="order-summary" aria-labelledby="summary-title">
            <span className="eyebrow">Resumen</span>
            <h2 id="summary-title">Tu compra</h2>
            <dl>
              <div><dt>Artículos ({summary.units})</dt><dd>{formatPrice(summary.total)}</dd></div>
              <div><dt>Envío</dt><dd>Incluido</dd></div>
              <div className="order-summary__total">
                <dt>Total</dt><dd>{formatPrice(summary.total)}</dd>
              </div>
            </dl>
            <button
              className="button button--wide"
              type="button"
              disabled={pendingAction === 'checkout'}
              onClick={checkout}
            >
              {pendingAction === 'checkout' ? 'Procesando…' : 'Pagar ahora'}
            </button>
            <p className="order-summary__note">
              Esta es una compra simulada. No se realizará ningún cargo real.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}
