import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import axios, { type AxiosInstance } from 'axios'
import type { AuthResponse, User } from '../types'

export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface AuthContextValue {
  user: User | null
  authReady: boolean
  login: (username: string, password: string) => Promise<AuthResponse>
  register: (username: string, password: string) => Promise<AuthResponse>
  logout: () => Promise<void>
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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const sessionGeneration = useRef(0)

  useEffect(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    const generation = ++sessionGeneration.current

    axios.get<{ user: User }>(`${API_BASE_URL}/api/auth/me`, { withCredentials: true })
      .then(response => {
        if (generation === sessionGeneration.current && isUser(response.data.user)) {
          setUser(response.data.user)
        }
      })
      .catch(() => {
        if (generation === sessionGeneration.current) setUser(null)
      })
      .finally(() => {
        if (generation === sessionGeneration.current) setAuthReady(true)
      })
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<AuthResponse> => {
    const generation = ++sessionGeneration.current
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/login`,
      { username, password },
      { withCredentials: true }
    )
    if (generation !== sessionGeneration.current) return response.data
    setUser(response.data.user)
    setAuthReady(true)
    return response.data
  }, [])

  const register = useCallback(async (username: string, password: string): Promise<AuthResponse> => {
    const generation = ++sessionGeneration.current
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/register`,
      { username, password },
      { withCredentials: true }
    )
    if (generation !== sessionGeneration.current) return response.data
    setUser(response.data.user)
    setAuthReady(true)
    return response.data
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    ++sessionGeneration.current
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true })
    } finally {
      setUser(null)
      setAuthReady(true)
    }
  }, [])

  const authAxios = useMemo(
    () => axios.create({ baseURL: API_BASE_URL, withCredentials: true }),
    []
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, authReady, login, register, logout, authAxios }),
    [user, authReady, login, register, logout, authAxios]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
