interface QuantityControlProps {
  title: string
  quantity: number
  maxStock: number
  busy: boolean
  onChange: (quantity: number) => void
}

export default function QuantityControl({
  title,
  quantity,
  maxStock,
  busy,
  onChange
}: QuantityControlProps) {
  return (
    <>
      <span className="quantity-control__label">Cantidad</span>
      <div
        className="quantity-control"
        role="group"
        aria-label={`Cantidad de ${title}`}
      >
        <button
          type="button"
          aria-label={`Reducir cantidad de ${title}`}
          disabled={quantity <= 1 || busy}
          onClick={() => onChange(quantity - 1)}
        >−</button>
        <output aria-live="polite">{quantity}</output>
        <button
          type="button"
          aria-label={`Aumentar cantidad de ${title}`}
          disabled={quantity >= maxStock || busy}
          onClick={() => onChange(quantity + 1)}
        >+</button>
      </div>
    </>
  )
}
