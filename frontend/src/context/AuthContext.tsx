import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import axios, { type AxiosInstance } from 'axios'
import type { AuthResponse, User } from '../types'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<AuthResponse>
  register: (username: string, password: string) => Promise<AuthResponse>
  logout: () => void
  authAxios: AxiosInstance
}

interface AuthProviderProps {
  children: ReactNode
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'number' && typeof candidate.username === 'string'
}

function loadStoredUser(): User | null {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null

  try {
    const parsedUser: unknown = JSON.parse(storedUser)
    return isUser(parsedUser) ? parsedUser : null
  } catch {
    return null
  }
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<User | null>(loadStoredUser)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')

    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [token, user])

  const login = useCallback(async (username: string, password: string): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, {
      username,
      password
    })
    setToken(response.data.token)
    setUser(response.data.user)
    return response.data
  }, [])

  const register = useCallback(async (username: string, password: string): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, {
      username,
      password
    })
    setToken(response.data.token)
    setUser(response.data.user)
    return response.data
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const authAxios = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE_URL })
    instance.interceptors.request.use(config => {
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })
    return instance
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, login, register, logout, authAxios }),
    [user, token, login, register, logout, authAxios]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
