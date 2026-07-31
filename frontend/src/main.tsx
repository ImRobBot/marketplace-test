import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  type NavLinkRenderProps
} from 'react-router-dom'
import Home from './pages/Home'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './context/AuthContext'
import './styles.css'

function AppShell() {
  const { user, token, logout } = useAuth()
  const navClass = ({ isActive }: NavLinkRenderProps): string => (
    `nav-link${isActive ? ' nav-link--active' : ''}`
  )

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>

      <header className="site-header">
        <div className="page-shell header-inner">
          <Link className="brand" to="/" aria-label="Mercado Uno, inicio">
            <span className="brand__mark" aria-hidden="true">M</span>
            <span className="brand__name">Mercado Uno</span>
          </Link>

          <nav className="main-nav" aria-label="Navegación principal">
            <NavLink className={navClass} to="/" end>Explorar</NavLink>
            <NavLink className={navClass} to="/cart">Carrito</NavLink>
          </nav>

          <div className="header-actions">
            {token ? (
              <>
                <span className="user-chip" title={user?.username || 'Tu cuenta'}>
                  <span className="user-chip__avatar" aria-hidden="true">
                    {(user?.username || 'U').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="user-chip__name">{user?.username || 'Tu cuenta'}</span>
                </span>
                <button className="text-button" type="button" onClick={logout}>Salir</button>
              </>
            ) : (
              <>
                <NavLink className="text-button header-login" to="/login">Ingresar</NavLink>
                <Link className="button button--small" to="/register">Crear cuenta</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={
            <section className="page-shell empty-state page-section">
              <span className="eyebrow">Error 404</span>
              <h1>Esta página no está en el catálogo.</h1>
              <p>Puede que el enlace haya cambiado o que el producto ya no esté disponible.</p>
              <Link className="button" to="/">Volver a explorar</Link>
            </section>
          } />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="page-shell footer-inner">
          <div>
            <span className="brand brand--footer">
              <span className="brand__mark" aria-hidden="true">M</span>
              <span className="brand__name">Mercado Uno</span>
            </span>
            <p>Una experiencia de compra pequeña, clara y bien pensada.</p>
          </div>
          <p className="footer-note">Demo interactiva · Compra simulada</p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('No se encontró el elemento raíz de la aplicación')

createRoot(rootElement).render(<App />)
