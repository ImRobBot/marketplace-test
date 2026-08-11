import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import ProductBuyBox from '../components/product/ProductBuyBox'
import ProductDetailInfo from '../components/product/ProductDetailInfo'
import ProductLoadingState from '../components/product/ProductLoadingState'
import ProductVisual from '../components/product/ProductVisual'
import { API_BASE_URL, useAuth } from '../context/AuthContext'
import { getProductMeta } from '../lib/products'
import type { Feedback, Product as ProductData } from '../types'

export default function Product() {
  const { id } = useParams<{ id: string }>()
  const { authAxios, user } = useAuth()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    if (!id) {
      setProduct(null)
      setError('El producto que buscas no existe.')
      setLoading(false)
      return
    }

    axios.get<ProductData>(`${API_BASE_URL}/api/products/${id}`)
      .then(response => {
        if (active) setProduct(response.data)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        const notFound = axios.isAxiosError(requestError) && requestError.response?.status === 404
        setError(notFound
          ? 'Este producto ya no está disponible.'
          : 'No pudimos cargar el producto. Inténtalo de nuevo más tarde.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [id])

  const addToCart = async (selectedProduct: ProductData): Promise<void> => {
    setAdding(true)
    setFeedback(null)
    try {
      await authAxios.post('/api/cart', { productId: selectedProduct.id, qty: quantity })
      setFeedback({
        type: 'success',
        message: `${quantity} × ${selectedProduct.title} añadido al carrito.`
      })
    } catch {
      setFeedback({ type: 'error', message: 'No pudimos actualizar el carrito. Inténtalo de nuevo.' })
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <ProductLoadingState />

  if (error || !product) {
    return (
      <EmptyState
        as="section"
        bordered={false}
        className="page-shell page-section"
        headingAs="h1"
        icon="!"
        title="No encontramos el producto"
        description={error || 'El producto que buscas no existe.'}
        actions={<Link className="button" to="/">Volver al catálogo</Link>}
      />
    )
  }

  const meta = getProductMeta(product.id)
  const outOfStock = product.stock <= 0

  return (
    <div className="page-shell page-section product-page">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link to="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link to="/#catalogo">Catálogo</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.title}</span>
      </nav>

      <section className="product-detail" aria-labelledby="product-title">
        <div className="product-detail__visual">
          <ProductVisual product={product} />
        </div>
        <ProductDetailInfo product={product} meta={meta} outOfStock={outOfStock} />
        <ProductBuyBox
          product={product}
          productId={id}
          authenticated={Boolean(user)}
          outOfStock={outOfStock}
          quantity={quantity}
          adding={adding}
          feedback={feedback}
          onQuantityChange={setQuantity}
          onAdd={addToCart}
        />
      </section>
    </div>
  )
}
