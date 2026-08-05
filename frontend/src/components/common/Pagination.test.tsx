import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Pagination from './Pagination'

describe('Pagination', () => {
  it('muestra el rango y permite avanzar de página', () => {
    const onPageChange = vi.fn()

    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        pageSize={12}
        onPageChange={onPageChange}
      />
    )

    expect(screen.getByText('Mostrando 1–12 de 100 productos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ir a la página 1' })).toHaveAttribute(
      'aria-current',
      'page'
    )

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('oculta los controles cuando todos los productos caben en una página', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalItems={8}
        pageSize={12}
        onPageChange={vi.fn()}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
