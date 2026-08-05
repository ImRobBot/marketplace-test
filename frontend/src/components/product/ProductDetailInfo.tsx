import { getProductDescription, type ProductMeta } from '../../lib/products'
import type { Product } from '../../types'

interface ProductDetailInfoProps {
  product: Product
  meta: ProductMeta
  outOfStock: boolean
}

export default function ProductDetailInfo({
  product,
  meta,
  outOfStock
}: Readonly<ProductDetailInfoProps>) {
  return (
    <div className="product-detail__content">
      <span className="eyebrow">{meta.category}</span>
      <h1 id="product-title">{product.title}</h1>
      <span className="product-reference">Referencia MU-{meta.code}</span>
      <p className="product-detail__description">{getProductDescription(product)}</p>

      <div className="product-highlights">
        <h2>Acerca de este producto</h2>
        <ul>
          <li>Información de precio y stock actualizada.</li>
          <li>Disponible para una experiencia de compra simulada.</li>
          <li>Se añade y administra directamente desde tu carrito.</li>
        </ul>
      </div>

      <dl className="product-facts">
        <div>
          <dt>Disponibilidad</dt>
          <dd>{outOfStock ? 'Agotado temporalmente' : `${product.stock} unidades`}</dd>
        </div>
        <div><dt>Categoría</dt><dd>{meta.category}</dd></div>
        <div><dt>Tipo de compra</dt><dd>Demostración sin cargo</dd></div>
      </dl>
    </div>
  )
}
