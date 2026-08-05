import { getProductMeta } from '../../lib/products'
import type { ProductPreview } from '../../types'

interface ProductVisualProps {
  product: Pick<ProductPreview, 'id' | 'title'>
  compact?: boolean
}

export default function ProductVisual({ product, compact = false }: Readonly<ProductVisualProps>) {
  const meta = getProductMeta(product.id)
  const title = product.title || 'Producto'

  return (
    <div
      className={`product-visual product-visual--${meta.theme}${compact ? ' product-visual--compact' : ''}`}
      role="img"
      aria-label={`Presentación gráfica de ${title}`}
    >
      <span className="product-visual__code" aria-hidden="true">{meta.code}</span>
      <span className="product-visual__object" aria-hidden="true">
        <span className="product-visual__object-detail" />
      </span>
      {!compact && <span className="product-visual__label">{meta.category}</span>}
    </div>
  )
}
