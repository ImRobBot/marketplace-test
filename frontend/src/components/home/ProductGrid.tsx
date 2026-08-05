import EmptyState from '../common/EmptyState'
import ProductCard from './ProductCard'
import ProductGridSkeleton from './ProductGridSkeleton'
import type { Product } from '../../types'

interface ProductGridProps {
  products: Product[]
  loading: boolean
  error: string
  addingId: number | null
  authenticated: boolean
  onClear: () => void
  onRetry: () => void
  onAdd: (product: Product) => void
}

export default function ProductGrid({
  products,
  loading,
  error,
  addingId,
  authenticated,
  onClear,
  onRetry,
  onAdd
}: Readonly<ProductGridProps>) {
  if (loading) return <ProductGridSkeleton />

  if (error) {
    return (
      <EmptyState
        role="alert"
        headingAs="h3"
        icon="!"
        title="El catálogo no está disponible"
        description={error}
        actions={<button className="button" type="button" onClick={onRetry}>Volver a intentar</button>}
      />
    )
  }

  if (products.length === 0) {
    return (
      <EmptyState
        headingAs="h3"
        icon="0"
        title="No encontramos coincidencias"
        description="Prueba con otro término o vuelve a ver todos los productos."
        actions={(
          <button className="button button--secondary" type="button" onClick={onClear}>
            Limpiar búsqueda
          </button>
        )}
      />
    )
  }

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard
          product={product}
          authenticated={authenticated}
          adding={addingId === product.id}
          onAdd={onAdd}
          key={product.id}
        />
      ))}
    </div>
  )
}
