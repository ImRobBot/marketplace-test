import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useHeaderSearch } from '../../hooks/useHeaderSearch'
import Brand from '../common/Brand'
import CategoryNav from './CategoryNav'
import HeaderSearch from './HeaderSearch'

export default function SiteHeader() {
  const { user, token, logout } = useAuth()
  const { query, setQuery, submitSearch } = useHeaderSearch()

  return (
    <header className="site-header">
      <div className="header-notice">
        <div className="page-shell header-notice__inner">
          <span>Marketplace de demostración</span>
          <span>No se realizan cargos reales</span>
        </div>
      </div>

      <div className="header-primary">
        <div className="page-shell header-inner">
          <Brand linkToHome />

          <span className="delivery-spot" aria-label="Catálogo disponible en México">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s7-6.2 7-13a7 7 0 1 0-14 0c0 6.8 7 13 7 13Z" />
              <circle cx="12" cy="8" r="2.4" />
            </svg>
            <span><small>Explorar en</small><strong>México</strong></span>
          </span>

          <HeaderSearch query={query} onQueryChange={setQuery} onSubmit={submitSearch} />

          <div className="header-actions">
            {token ? (
              <div className="header-account header-account--signed-in">
                <span className="user-chip__avatar" aria-hidden="true">
                  {(user?.username || 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="header-account__copy">
                  <small>Hola, {user?.username || 'usuario'}</small>
                  <button type="button" onClick={logout}>Cerrar sesión</button>
                </span>
              </div>
            ) : (
              <Link className="header-account" to="/login">
                <span className="header-account__copy">
                  <small>Hola, ingresa</small>
                  <strong>Cuenta</strong>
                </span>
              </Link>
            )}

            <NavLink
              className={({ isActive }) => `header-cart${isActive ? ' header-cart--active' : ''}`}
              to="/cart"
              aria-label="Abrir carrito"
            >
              <svg viewBox="0 0 32 28" aria-hidden="true">
                <path d="M2.5 3.5h4l2.3 14.2h15.7l3.2-10.2H8" />
                <circle cx="12" cy="23.5" r="1.8" />
                <circle cx="23" cy="23.5" r="1.8" />
              </svg>
              <span><small>Tu</small><strong>Carrito</strong></span>
            </NavLink>
          </div>
        </div>
      </div>

      <CategoryNav />
    </header>
  )
}
