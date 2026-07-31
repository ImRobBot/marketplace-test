import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import ProductVisual from '../components/ProductVisual'
import { API_BASE_URL, useAuth } from '../context/AuthContext'
import { formatPrice, getProductDescription, getProductMeta } from '../lib/products'
import type { Feedback, Product } from '../types'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [addingId, setAddingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [requestKey, setRequestKey] = useState(0)
  const { authAxios, token } = useAuth()

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    axios.get<Product[]>(`${API_BASE_URL}/api/products`)
      .then(response => {
        if (active) setProducts(response.data)
      })
      .catch(() => {
        if (active) {
          setError('No pudimos cargar el catálogo. Revisa que la API esté encendida e inténtalo de nuevo.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [requestKey])

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return products

    return products.filter(product => (
      `${product.title} ${product.description || ''}`.toLowerCase().includes(normalizedQuery)
    ))
  }, [products, query])

  const addToCart = async (product: Product): Promise<void> => {
    setAddingId(product.id)
    setFeedback(null)

    try {
      await authAxios.post('/api/cart', { productId: product.id, qty: 1 })
      setFeedback({ type: 'success', message: `${product.title} se añadió al carrito.` })
    } catch {
      setFeedback({ type: 'error', message: `No pudimos añadir ${product.title}. Inténtalo de nuevo.` })
    } finally {
      setAddingId(null)
    }
  }

  return (
    <>
      <section className="page-shell hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <span className="eyebrow">Colección esencial · 2026</span>
          <h1 id="hero-title">Objetos simples para días mejor pensados.</h1>
          <p className="hero__lead">
            Una selección breve, precios claros y una experiencia de compra sin ruido.
          </p>
          <div className="hero__actions">
            <a className="button" href="#catalogo">Explorar colección</a>
            <Link className="button button--secondary" to={token ? '/cart' : '/register'}>
              {token ? 'Ver mi carrito' : 'Crear una cuenta'}
            </Link>
          </div>
          <ul className="hero__benefits" aria-label="Beneficios de la tienda">
            <li>Stock visible</li>
            <li>Precios claros</li>
            <li>Compra simulada</li>
          </ul>
        </div>

        <div className="hero__showcase" aria-label="Resumen del catálogo">
          <div className="showcase-card">
            <span className="showcase-card__eyebrow">Selección de hoy</span>
            <span className="showcase-card__number">
              {loading ? '—' : String(products.length).padStart(2, '0')}
            </span>
            <span className="showcase-card__label">productos disponibles</span>
          </div>
          <div className="showcase-orbit showcase-orbit--one" aria-hidden="true" />
          <div className="showcase-orbit showcase-orbit--two" aria-hidden="true" />
          <span className="showcase-note">Curado para lo cotidiano</span>
        </div>
      </section>

      <section id="catalogo" className="page-shell catalog-section" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Catálogo</span>
            <h2 id="catalog-title">Seleccionados para ti</h2>
            <p>Menos opciones, mejores decisiones.</p>
          </div>

          <div className="search-field">
            <label className="sr-only" htmlFor="product-search">Buscar productos</label>
            <span className="search-field__icon" aria-hidden="true" />
            <input
              id="product-search"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Buscar en el catálogo"
              autoComplete="off"
            />
          </div>
        </div>

        {feedback && (
          <div
            className={`notice notice--${feedback.type}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            <span>{feedback.message}</span>
            {feedback.type === 'success' && <Link to="/cart">Ver carrito</Link>}
          </div>
        )}

        {loading && (
          <div className="product-grid" aria-busy="true" aria-label="Cargando productos">
            {[1, 2, 3].map(item => (
              <article className="product-card product-card--skeleton" key={item}>
                <div className="skeleton skeleton--visual" />
                <div className="product-card__body">
                  <div className="skeleton skeleton--line-short" />
                  <div className="skeleton skeleton--line" />
                  <div className="skeleton skeleton--line-medium" />
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="empty-state empty-state--bordered" role="alert">
            <span className="empty-state__icon" aria-hidden="true">!</span>
            <h3>El catálogo no está disponible</h3>
            <p>{error}</p>
            <button className="button" type="button" onClick={() => setRequestKey(key => key + 1)}>
              Volver a intentar
            </button>
          </div>
        )}

        {!loading && !error && visibleProducts.length === 0 && (
          <div className="empty-state empty-state--bordered">
            <span className="empty-state__icon" aria-hidden="true">0</span>
            <h3>No encontramos coincidencias</h3>
            <p>Prueba con otro término o vuelve a ver todos los productos.</p>
            <button className="button button--secondary" type="button" onClick={() => setQuery('')}>
              Limpiar búsqueda
            </button>
          </div>
        )}

        {!loading && !error && visibleProducts.length > 0 && (
          <div className="product-grid">
            {visibleProducts.map(product => {
              const meta = getProductMeta(product.id)
              const outOfStock = product.stock <= 0

              return (
                <article className="product-card" key={product.id}>
                  <Link
                    className="product-card__visual-link"
                    to={`/product/${product.id}`}
                    aria-label={`Ver ${product.title}`}
                  >
                    <ProductVisual product={product} />
                  </Link>
                  <div className="product-card__body">
                    <div className="product-card__meta">
                      <span>{meta.category}</span>
                      <span className={`stock-badge${outOfStock ? ' stock-badge--empty' : ''}`}>
                        {outOfStock ? 'Agotado' : `${product.stock} disponibles`}
                      </span>
                    </div>
                    <h3><Link to={`/product/${product.id}`}>{product.title}</Link></h3>
                    <p className="product-card__description">{getProductDescription(product)}</p>
                    <div className="product-card__footer">
                      <div className="price-block">
                        <strong>{formatPrice(product.price)}</strong>
                        <span>MXN</span>
                      </div>
                      {token ? (
                        <button
                          className="button button--compact"
                          type="button"
                          disabled={outOfStock || addingId === product.id}
                          aria-label={`Añadir ${product.title} al carrito`}
                          onClick={() => addToCart(product)}
                        >
                          {addingId === product.id ? 'Añadiendo…' : 'Añadir'}
                        </button>
                      ) : (
                        <Link
                          className="button button--compact button--secondary"
                          to="/login"
                          state={{ from: '/' }}
                        >
                          Ingresar
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="page-shell value-strip" aria-label="Por qué comprar aquí">
        <div className="value-strip__item">
          <span className="value-strip__number">01</span>
          <div><strong>Una selección breve</strong><p>Solo lo esencial para decidir mejor.</p></div>
        </div>
        <div className="value-strip__item">
          <span className="value-strip__number">02</span>
          <div><strong>Información clara</strong><p>Precio y stock siempre a la vista.</p></div>
        </div>
        <div className="value-strip__item">
          <span className="value-strip__number">03</span>
          <div><strong>Sin sorpresas</strong><p>Esta demo no realiza cargos reales.</p></div>
        </div>
      </section>
    </>
  )
}
