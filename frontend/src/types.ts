export interface User {
  id: number
  username: string
}

export interface AuthResponse {
  user: User
}

export interface ApiErrorResponse {
  error?: string
}

export interface Product {
  id: number
  title: string
  price: number | string
  stock: number
  description?: string | null
}

export type ProductPreview = Pick<Product, 'id' | 'title' | 'price'>
  & Partial<Pick<Product, 'stock' | 'description'>>

export interface CartItem {
  productId: number
  qty: number
  product?: Product | null
}

export type Feedback = {
  type: 'success' | 'error'
  message: string
}
