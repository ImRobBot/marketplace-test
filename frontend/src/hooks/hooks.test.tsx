import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { useCatalogQuery } from './useCatalogQuery'
import { useHeaderSearch } from './useHeaderSearch'
import { usePagination } from './usePagination'
import { useProducts } from './useProducts'

vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}))

const mockedGet = vi.mocked(axios.get)

function routerWrapper(initialEntries: string[] = ['/']) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  }
}

describe('custom hooks', () => {
  it('reads, changes and clears catalog query parameters', async () => {
    const scrollIntoView = vi.fn()
    document.body.innerHTML = '<div id="catalogo"></div>'
    document.getElementById('catalogo')!.scrollIntoView = scrollIntoView

    const { result } = renderHook(() => useCatalogQuery(), {
      wrapper: routerWrapper(['/?q=initial'])
    })

    await waitFor(() => expect(result.current.query).toBe('initial'))
    act(() => result.current.applyDepartment('esencial'))
    await waitFor(() => expect(result.current.query).toBe('esencial'))

    act(() => result.current.clearSearch())
    await waitFor(() => expect(result.current.query).toBe(''))
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('submits a normalized header search and navigates to the catalog', async () => {
    const { result } = renderHook(
      () => ({ hook: useHeaderSearch(), location: useLocation() }),
      { wrapper: routerWrapper(['/']) }
    )

    act(() => result.current.hook.setQuery('  lámpara  '))
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>
    act(() => result.current.hook.submitSearch(event))

    await waitFor(() => expect(result.current.location.search).toContain('l%C3%A1mpara'))
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('handles products success, failure and retry', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: [{ id: 1, title: 'Producto', price: 1, stock: 1 }] })
      .mockRejectedValueOnce(new Error('offline'))

    const { result } = renderHook(() => useProducts())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.products).toHaveLength(1)

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.error).toContain('No pudimos cargar'))
  })

  it('paginates items and resets when the reset key changes', async () => {
    const { result, rerender } = renderHook(
      ({ resetKey }) => usePagination([1, 2, 3, 4], { pageSize: 2, resetKey }),
      { initialProps: { resetKey: 'first' } }
    )

    expect(result.current.items).toEqual([1, 2])
    act(() => result.current.setPage(2))
    expect(result.current.items).toEqual([3, 4])

    rerender({ resetKey: 'second' })
    await waitFor(() => expect(result.current.currentPage).toBe(1))
    expect(result.current.items).toEqual([1, 2])
  })
})
