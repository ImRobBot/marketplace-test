const loadingItems = [1, 2]

export default function CartLoadingState() {
  return (
    <div className="cart-layout" aria-busy="true">
      <div className="cart-list">
        {loadingItems.map(item => <div className="skeleton skeleton--cart-item" key={item} />)}
      </div>
      <div className="skeleton skeleton--summary" />
    </div>
  )
}
