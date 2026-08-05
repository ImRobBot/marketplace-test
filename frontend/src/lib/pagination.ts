export const DEFAULT_PAGE_SIZE = 12

function normalizePageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    throw new RangeError('El tamaño de página debe ser mayor que cero')
  }

  return Math.trunc(pageSize)
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  const normalizedPageSize = normalizePageSize(pageSize)
  const normalizedTotal = Math.max(0, Math.trunc(totalItems))

  return Math.max(1, Math.ceil(normalizedTotal / normalizedPageSize))
}

export function clampPage(page: number, totalPages: number): number {
  const normalizedTotalPages = Math.max(1, Math.trunc(totalPages))
  const normalizedPage = Number.isFinite(page) ? Math.trunc(page) : 1

  return Math.min(Math.max(normalizedPage, 1), normalizedTotalPages)
}

export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): T[] {
  const normalizedPageSize = normalizePageSize(pageSize)
  const currentPage = clampPage(page, getTotalPages(items.length, normalizedPageSize))
  const startIndex = (currentPage - 1) * normalizedPageSize

  return items.slice(startIndex, startIndex + normalizedPageSize)
}

export function getPageRange(
  totalItems: number,
  page: number,
  pageSize: number
): { start: number; end: number } {
  const normalizedPageSize = normalizePageSize(pageSize)
  const normalizedTotal = Math.max(0, Math.trunc(totalItems))

  if (normalizedTotal === 0) {
    return { start: 0, end: 0 }
  }

  const currentPage = clampPage(
    page,
    getTotalPages(normalizedTotal, normalizedPageSize)
  )
  const start = (currentPage - 1) * normalizedPageSize + 1

  return {
    start,
    end: Math.min(start + normalizedPageSize - 1, normalizedTotal),
  }
}

export type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end'

export function getPaginationItems(
  page: number,
  totalPages: number
): PaginationItem[] {
  const normalizedTotalPages = Math.max(1, Math.trunc(totalPages))
  const currentPage = clampPage(page, normalizedTotalPages)

  if (normalizedTotalPages <= 7) {
    return Array.from({ length: normalizedTotalPages }, (_, index) => index + 1)
  }

  const pages = [
    1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    normalizedTotalPages,
  ]
    .filter((candidate) => candidate >= 1 && candidate <= normalizedTotalPages)
    .filter((candidate, index, candidates) => candidates.indexOf(candidate) === index)
    .sort((left, right) => left - right)

  const items: PaginationItem[] = []

  pages.forEach((candidate, index) => {
    const previous = pages[index - 1]

    if (previous !== undefined && candidate - previous > 1) {
      items.push(previous === 1 ? 'ellipsis-start' : 'ellipsis-end')
    }

    items.push(candidate)
  })

  return items
}
