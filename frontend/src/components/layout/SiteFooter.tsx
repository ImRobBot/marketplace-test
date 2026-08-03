import { Link } from 'react-router-dom'
import Brand from '../common/Brand'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="footer-back-to-top" href="#root">Volver arriba</a>
      <div className="page-shell footer-inner">
        <div className="footer-brand">
          <Brand footer />
          <p>Una tienda de demostración clara, rápida y hecha para explorar.</p>
        </div>
        <div className="footer-column">
          <strong>Comprar</strong>
          <Link to="/">Todos los productos</Link>
          <Link to="/?q=Selección%20especial#catalogo">Selección especial</Link>
          <Link to="/cart">Tu carrito</Link>
        </div>
        <div className="footer-column">
          <strong>Tu cuenta</strong>
          <Link to="/login">Iniciar sesión</Link>
          <Link to="/register">Crear cuenta</Link>
        </div>
        <div className="footer-column">
          <strong>Acerca de la demo</strong>
          <span>Checkout simulado</span>
          <span>Sin cargos reales</span>
          <span>Catálogo de práctica</span>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="page-shell">
          <span>Mercado Uno</span>
          <span>Demo interactiva · 2026</span>
        </div>
      </div>
    </footer>
  )
}
