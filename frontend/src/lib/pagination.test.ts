import { describe, expect, it } from 'vitest'
import {
  clampPage,
  getPageRange,
  getPaginationItems,
  getTotalPages,
  paginateItems,
} from './pagination'

describe('pagination utilities', () => {
  it('calcula el total de páginas y mantiene una página vacía', () => {
    expect(getTotalPages(100, 12)).toBe(9)
    expect(getTotalPages(0, 12)).toBe(1)
  })

  it('limita una página al rango disponible', () => {
    expect(clampPage(0, 9)).toBe(1)
    expect(clampPage(14, 9)).toBe(9)
  })

  it('obtiene únicamente los productos de la página solicitada', () => {
    const products = Array.from({ length: 25 }, (_, index) => index + 1)

    expect(paginateItems(products, 2, 12)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 13)
    )
    expect(paginateItems(products, 3, 12)).toEqual([25])
  })

  it('calcula el rango humano mostrado', () => {
    expect(getPageRange(100, 9, 12)).toEqual({ start: 97, end: 100 })
    expect(getPageRange(0, 1, 12)).toEqual({ start: 0, end: 0 })
  })

  it('reduce las páginas largas con separadores', () => {
    expect(getPaginationItems(5, 9)).toEqual([
      1,
      'ellipsis-start',
      4,
      5,
      6,
      'ellipsis-end',
      9,
    ])
  })
})
