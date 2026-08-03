const skeletonItems = [1, 2, 3, 4]

export default function ProductGridSkeleton() {
  return (
    <div className="product-grid" aria-busy="true" aria-label="Cargando productos">
      {skeletonItems.map(item => (
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
  )
}
