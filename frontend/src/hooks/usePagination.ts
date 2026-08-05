import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  clampPage,
  DEFAULT_PAGE_SIZE,
  getPageRange,
  getTotalPages,
  paginateItems,
} from '../lib/pagination'

interface UsePaginationOptions {
  pageSize?: number
  resetKey?: string
}

interface PaginationState {
  page: number
  resetKey: string
}

export function usePagination<T>(
  items: readonly T[],
  options: UsePaginationOptions = {}
) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const resetKey = options.resetKey ?? ''
  const totalPages = getTotalPages(items.length, pageSize)
  const [state, setState] = useState<PaginationState>({ page: 1, resetKey })
  const requestedPage = state.resetKey === resetKey ? state.page : 1
  const currentPage = clampPage(requestedPage, totalPages)

  useEffect(() => {
    setState((current) => {
      const nextPage =
        current.resetKey === resetKey
          ? clampPage(current.page, totalPages)
          : 1

      if (current.resetKey === resetKey && current.page === nextPage) {
        return current
      }

      return { page: nextPage, resetKey }
    })
  }, [resetKey, totalPages])

  const setPage = useCallback(
    (page: number) => {
      setState({ page: clampPage(page, totalPages), resetKey })
    },
    [resetKey, totalPages]
  )

  const paginatedItems = useMemo(
    () => paginateItems(items, currentPage, pageSize),
    [currentPage, items, pageSize]
  )
  const range = getPageRange(items.length, currentPage, pageSize)

  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    startItem: range.start,
    endItem: range.end,
    setPage,
  }
}
