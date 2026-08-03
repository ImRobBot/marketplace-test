import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

interface CatalogQueryState {
  query: string
  setQuery: (query: string) => void
  applyDepartment: (query: string) => void
  clearSearch: () => void
}

export function useCatalogQuery(): CatalogQueryState {
  const [query, setQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const applyDepartment = (departmentQuery: string): void => {
    setSearchParams({ q: departmentQuery })
    window.setTimeout(() => {
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  const clearSearch = (): void => {
    setQuery('')
    setSearchParams({})
  }

  return { query, setQuery, applyDepartment, clearSearch }
}
