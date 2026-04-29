import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi } from './api'

export interface User {
  id: number
  email: string
  fullName: string
  businessName?: string
  businessType?: string
}

export interface Subscription {
  plan: 'trial' | 'basic' | 'pro' | 'business'
  status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'expired'
  valid: boolean
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  limits: {
    campaigns: number
    platforms: number
    aiOptimization: boolean
    whiteLabel: boolean
  }
  priceIls: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  subscription: Subscription | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; fullName: string; businessName?: string; businessType?: string }) => Promise<void>
  logout: () => void
  loading: boolean
  refreshSubscription: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedSub = localStorage.getItem('subscription')
    if (savedUser && token) {
      try { setUser(JSON.parse(savedUser)) } catch {}
    }
    if (savedSub) {
      try { setSubscription(JSON.parse(savedSub)) } catch {}
    }
    setLoading(false)
  }, [token])

  const _persist = (tok: string, u: User, sub: Subscription) => {
    localStorage.setItem('token', tok)
    localStorage.setItem('user', JSON.stringify(u))
    localStorage.setItem('subscription', JSON.stringify(sub))
    setToken(tok)
    setUser(u)
    setSubscription(sub)
  }

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    const { accessToken, user: u, subscription: sub } = res.data
    _persist(accessToken, u, sub)
  }

  const register = async (data: { email: string; password: string; fullName: string; businessName?: string; businessType?: string }) => {
    const res = await authApi.register(data)
    const { accessToken, user: u, subscription: sub } = res.data
    _persist(accessToken, u, sub)
  }

  const refreshSubscription = async () => {
    try {
      const { billingApi } = await import('./api')
      const res = await billingApi.getSubscription()
      const sub = res.data
      setSubscription(sub)
      localStorage.setItem('subscription', JSON.stringify(sub))
    } catch {}
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('subscription')
    setToken(null)
    setUser(null)
    setSubscription(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, subscription, login, register, logout, loading, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
