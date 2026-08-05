import { Link } from 'react-router-dom'

interface CartHeaderProps {
  authenticated: boolean
  units: number
}

export default function CartHeader({ authenticated, units }: Readonly<CartHeaderProps>) {
  const itemLabel = units === 1 ? 'artículo' : 'artículos'
  const cartMessage = authenticated
    ? `${units} ${itemLabel} en tu compra`
    : 'Inicia sesión para ver tus productos'

  return (
    <div className="section-heading section-heading--cart">
      <div>
        <span className="eyebrow">Tu selección</span>
        <h1>Carrito</h1>
        <p>
          {cartMessage}
        </p>
      </div>
      <Link className="back-link" to="/"><span aria-hidden="true">←</span> Seguir explorando</Link>
    </div>
  )
}
