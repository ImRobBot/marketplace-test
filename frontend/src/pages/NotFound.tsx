import { Link } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'

export default function NotFound() {
  return (
    <EmptyState
      as="section"
      bordered={false}
      className="page-shell page-section"
      eyebrow="Error 404"
      headingAs="h1"
      title="Esta página no está en el catálogo."
      description="Puede que el enlace haya cambiado o que el producto ya no esté disponible."
      actions={<Link className="button" to="/">Volver a explorar</Link>}
    />
  )
}
