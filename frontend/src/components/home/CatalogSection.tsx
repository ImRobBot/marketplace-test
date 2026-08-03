import FeedbackNotice from '../common/FeedbackNotice'
import Pagination from '../common/Pagination'
import ProductGrid from './ProductGrid'
import type { Feedback, Product } from '../../types'

interface CatalogSectionProps {
  products: Product[]
  totalResults: number
  currentPage: number
  pageSize: number
  loading: boolean
  error: string
  query: string
  feedback: Feedback | null
  addingId: number | null
  authenticated: boolean
  onQueryChange: (query: string) => void
  onClear: () => void
  onRetry: () => void
  onAdd: (product: Product) => void
  onPageChange: (page: number) => void
}

export default function CatalogSection({
  products,
  totalResults,
  currentPage,
  pageSize,
  loading,
  error,
  query,
  feedback,
  addingId,
  authenticated,
  onQueryChange,
  onClear,
  onRetry,
  onAdd,
  onPageChange
}: CatalogSectionProps) {
  return (
    <section id="catalogo" className="page-shell catalog-section" aria-labelledby="catalog-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h2 id="catalog-title">Productos destacados</h2>
          <p>Opciones útiles con precio y disponibilidad siempre visibles.</p>
        </div>

        <div className="search-field">
          <label className="sr-only" htmlFor="product-search">Filtrar productos</label>
          <span className="search-field__icon" aria-hidden="true" />
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder="Filtrar resultados"
            autoComplete="off"
          />
        </div>
      </div>

      {!loading && !error && (
        <div className="catalog-status" role="status" aria-live="polite">
          <span>
            {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
            {query ? ` para “${query}”` : ''}
          </span>
          {query && <button type="button" onClick={onClear}>Limpiar filtro</button>}
        </div>
      )}

      <FeedbackNotice
        feedback={feedback}
        actionLabel={feedback?.type === 'success' ? 'Ver carrito' : undefined}
        actionTo={feedback?.type === 'success' ? '/cart' : undefined}
      />

      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        addingId={addingId}
        authenticated={authenticated}
        onClear={onClear}
        onRetry={onRetry}
        onAdd={onAdd}
      />

      {!loading && !error && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalResults}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </section>
  )
}
