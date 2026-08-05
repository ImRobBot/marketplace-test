export default function ProductLoadingState() {
  return (
    <section
      className="page-shell page-section product-detail product-detail--loading"
      aria-busy="true"
      aria-label="Cargando producto"
    >
      <div className="skeleton skeleton--detail-visual" />
      <div className="product-detail__content">
        <div className="skeleton skeleton--line-short" />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line-medium" />
      </div>
      <span className="sr-only">Cargando información del producto…</span>
    </section>
  )
}
