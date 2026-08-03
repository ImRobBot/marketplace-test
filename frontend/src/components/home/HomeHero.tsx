import { Link } from 'react-router-dom'

interface HomeHeroProps {
  authenticated: boolean
  loading: boolean
  productCount: number
}

export default function HomeHero({ authenticated, loading, productCount }: HomeHeroProps) {
  return (
    <section className="page-shell hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <span className="eyebrow">Compra fácil · catálogo claro</span>
        <h1 id="hero-title">Todo lo que buscas, en un solo lugar.</h1>
        <p className="hero__lead">
          Explora productos útiles, revisa su disponibilidad y prueba una experiencia de compra completa.
        </p>
        <div className="hero__actions">
          <a className="button" href="#catalogo">Ver productos</a>
          <Link className="button button--secondary" to={authenticated ? '/cart' : '/register'}>
            {authenticated ? 'Ir a mi carrito' : 'Crear una cuenta'}
          </Link>
        </div>
        <ul className="hero__benefits" aria-label="Beneficios de la tienda">
          <li>Stock actualizado</li>
          <li>Precios transparentes</li>
          <li>Checkout de demostración</li>
        </ul>
      </div>

      <div className="hero__showcase" aria-label="Resumen del catálogo">
        <div className="showcase-card">
          <span className="showcase-card__eyebrow">Mercado Uno recomienda</span>
          <h2>Encuentra un nuevo favorito.</h2>
          <p>Una selección compacta para comprar sin perder tiempo.</p>
          <a href="#catalogo">Explorar ahora <span aria-hidden="true">→</span></a>
          <span className="showcase-card__count">
            {loading ? 'Cargando catálogo…' : `${productCount} productos disponibles`}
          </span>
        </div>
        <div className="showcase-merch" aria-hidden="true">
          <span className="merch-box merch-box--back" />
          <span className="merch-box merch-box--front"><b>M1</b></span>
          <span className="merch-disc">+</span>
        </div>
      </div>
    </section>
  )
}
