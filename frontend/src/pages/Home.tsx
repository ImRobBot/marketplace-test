import { useMemo, useState } from 'react'
import DepartmentSection from '../components/home/DepartmentSection'
import CatalogSection from '../components/home/CatalogSection'
import HomeHero from '../components/home/HomeHero'
import ValueStrip from '../components/home/ValueStrip'
import { useAuth } from '../context/AuthContext'
import { departments } from '../data/departments'
import { useCatalogQuery } from '../hooks/useCatalogQuery'
import { useProducts } from '../hooks/useProducts'
import { filterProducts } from '../lib/catalog'
import type { Feedback, Product } from '../types'

export default function Home() {
  const { products, loading, error, retry } = useProducts()
  const { query, setQuery, applyDepartment, clearSearch } = useCatalogQuery()
  const [addingId, setAddingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const { authAxios, token } = useAuth()

  const visibleProducts = useMemo(
    () => filterProducts(products, query),
    [products, query]
  )

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
      <HomeHero
        authenticated={Boolean(token)}
        loading={loading}
        productCount={products.length}
      />
      <DepartmentSection
        departments={departments}
        activeQuery={query}
        onSelect={applyDepartment}
        onClear={clearSearch}
      />
      <CatalogSection
        products={visibleProducts}
        loading={loading}
        error={error}
        query={query}
        feedback={feedback}
        addingId={addingId}
        authenticated={Boolean(token)}
        onQueryChange={setQuery}
        onClear={clearSearch}
        onRetry={retry}
        onAdd={addToCart}
      />
      <ValueStrip />
    </>
  )
}
