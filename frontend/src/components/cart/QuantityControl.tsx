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
}: Readonly<QuantityControlProps>) {
  return (
    <fieldset className="quantity-control">
      <legend className="quantity-control__label">Cantidad de {title}</legend>
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
    </fieldset>
  )
}
