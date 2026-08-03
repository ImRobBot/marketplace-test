import { Link } from 'react-router-dom'

interface CartHeaderProps {
  authenticated: boolean
  units: number
}

export default function CartHeader({ authenticated, units }: CartHeaderProps) {
  return (
    <div className="section-heading section-heading--cart">
      <div>
        <span className="eyebrow">Tu selección</span>
        <h1>Carrito</h1>
        <p>
          {authenticated
            ? `${units} ${units === 1 ? 'artículo' : 'artículos'} en tu compra`
            : 'Inicia sesión para ver tus productos'}
        </p>
      </div>
      <Link className="back-link" to="/"><span aria-hidden="true">←</span> Seguir explorando</Link>
    </div>
  )
}
