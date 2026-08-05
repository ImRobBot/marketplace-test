import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../context/AuthContext'
import type { Product } from '../types'

interface ProductsState {
  products: Product[]
  loading: boolean
  error: string
  retry: () => void
}

export function useProducts(): ProductsState {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    axios.get<Product[]>(`${API_BASE_URL}/api/products`)
      .then(response => {
        if (active) setProducts(response.data)
      })
      .catch(() => {
        if (active) {
          setError('No pudimos cargar el catálogo. Revisa que la API esté encendida e inténtalo de nuevo.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [requestKey])

  return {
    products,
    loading,
    error,
    retry: () => setRequestKey(key => key + 1)
  }
}
