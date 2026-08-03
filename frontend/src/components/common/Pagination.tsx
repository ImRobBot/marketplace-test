import {
  getPageRange,
  getPaginationItems,
  getTotalPages,
} from '../../lib/pagination'
import './Pagination.css'

interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const totalPages = getTotalPages(totalItems, pageSize)

  if (totalItems === 0 || totalPages <= 1) {
    return null
  }

  const range = getPageRange(totalItems, currentPage, pageSize)
  const items = getPaginationItems(currentPage, totalPages)

  return (
    <div className="pagination">
      <p className="pagination__summary" aria-live="polite">
        Mostrando {range.start}–{range.end} de {totalItems} productos
      </p>

      <nav className="pagination__nav" aria-label="Paginación del catálogo">
        <button
          className="pagination__button pagination__button--direction"
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <span aria-hidden="true">←</span> Anterior
        </button>

        <div className="pagination__pages">
          {items.map((item) =>
            typeof item === 'number' ? (
              <button
                className={`pagination__button pagination__button--page${
                  item === currentPage ? ' pagination__button--active' : ''
                }`}
                type="button"
                key={item}
                aria-label={`Ir a la página ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ) : (
              <span className="pagination__ellipsis" key={item} aria-hidden="true">
                …
              </span>
            )
          )}
        </div>

        <button
          className="pagination__button pagination__button--direction"
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente <span aria-hidden="true">→</span>
        </button>
      </nav>
    </div>
  )
}
