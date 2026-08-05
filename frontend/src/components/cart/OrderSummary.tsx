import { formatPrice } from '../../lib/products'
import type { CartSummary } from '../../lib/cart'

interface OrderSummaryProps {
  summary: CartSummary
  processing: boolean
  onCheckout: () => void
}

export default function OrderSummary({ summary, processing, onCheckout }: Readonly<OrderSummaryProps>) {
  return (
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
        disabled={processing}
        onClick={onCheckout}
      >
        {processing ? 'Procesando…' : 'Pagar ahora'}
      </button>
      <p className="order-summary__note">
        Esta es una compra simulada. No se realizará ningún cargo real.
      </p>
    </aside>
  )
}
