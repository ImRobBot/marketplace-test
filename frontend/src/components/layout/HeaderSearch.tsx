import type { FormEvent } from 'react'

interface HeaderSearchProps {
  query: string
  onQueryChange: (query: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function HeaderSearch({ query, onQueryChange, onSubmit }: HeaderSearchProps) {
  return (
    <form className="header-search" role="search" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="header-product-search">Buscar productos</label>
      <span className="header-search__scope" aria-hidden="true">Todo</span>
      <input
        id="header-product-search"
        type="search"
        value={query}
        onChange={event => onQueryChange(event.target.value)}
        placeholder="Buscar en Mercado Uno"
        autoComplete="off"
      />
      <button type="submit" aria-label="Buscar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.2 4.2" />
        </svg>
      </button>
    </form>
  )
}
