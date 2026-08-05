import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface HeaderSearchState {
  query: string
  setQuery: (query: string) => void
  submitSearch: (event: FormEvent<HTMLFormElement>) => void
}

export function useHeaderSearch(): HeaderSearchState {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (location.pathname !== '/') return
    setQuery(new URLSearchParams(location.search).get('q') || '')
  }, [location.pathname, location.search])

  const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const normalizedQuery = query.trim()

    navigate({
      pathname: '/',
      search: normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : '',
      hash: '#catalogo'
    })

    window.setTimeout(() => {
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  return { query, setQuery, submitSearch }
}
