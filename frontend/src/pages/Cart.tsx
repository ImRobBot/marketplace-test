import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import CartHeader from '../components/cart/CartHeader'
import CartItemCard from '../components/cart/CartItemCard'
import CartLoadingState from '../components/cart/CartLoadingState'
import OrderSummary from '../components/cart/OrderSummary'
import EmptyState from '../components/common/EmptyState'
import FeedbackNotice from '../components/common/FeedbackNotice'
import { useAuth } from '../context/AuthContext'
import { calculateCartSummary } from '../lib/cart'
import type { ApiErrorResponse, CartItem, Feedback } from '../types'

export default function Cart() {
  const { authAxios, user, authReady } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const load = useCallback(async (showLoading = true): Promise<void> => {
    if (!authReady) return

    if (!user) {
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
  }, [authAxios, authReady, user])

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

  const summary = useMemo(() => calculateCartSummary(items), [items])

  return (
    <div className="page-shell page-section cart-page">
      <CartHeader authenticated={Boolean(user)} units={summary.units} />
      <FeedbackNotice feedback={feedback} />

      {!authReady && <CartLoadingState />}

      {authReady && !user && (
        <EmptyState
          className="cart-auth-state"
          icon="M"
          title="Tu carrito te está esperando"
          description="Ingresa a tu cuenta para guardar productos y continuar con la compra simulada."
          actions={(
            <>
              <Link className="button" to="/login" state={{ from: '/cart' }}>Iniciar sesión</Link>
              <Link className="button button--secondary" to="/register">Crear cuenta</Link>
            </>
          )}
        />
      )}

      {authReady && user && loading && <CartLoadingState />}

      {authReady && user && !loading && error && (
        <EmptyState
          role="alert"
          icon="!"
          title="No pudimos abrir el carrito"
          description={error}
          actions={<button className="button" type="button" onClick={() => load()}>Volver a intentar</button>}
        />
      )}

      {authReady && user && !loading && !error && items.length === 0 && (
        <EmptyState
          icon=""
          iconClassName="empty-state__icon--bag"
          title="Tu carrito está vacío"
          description="Explora la colección y guarda aquí tus productos favoritos."
          actions={<Link className="button" to="/">Descubrir productos</Link>}
        />
      )}

      {authReady && user && !loading && !error && items.length > 0 && (
        <div className="cart-layout">
          <section className="cart-list" aria-label="Productos en el carrito">
            {items.map(item => (
              <CartItemCard
                item={item}
                pendingAction={pendingAction}
                onRemove={remove}
                onQuantityChange={updateQuantity}
                key={item.productId}
              />
            ))}
          </section>
          <OrderSummary
            summary={summary}
            processing={pendingAction === 'checkout'}
            onCheckout={checkout}
          />
        </div>
      )}
    </div>
  )
}
