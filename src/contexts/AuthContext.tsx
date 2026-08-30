import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { fetchBrokerForUser } from '@/lib/broker'
import { supabase } from '@/lib/supabase'
import type { Broker } from '@/types/database'

type AuthContextValue = {
  session: Session | null
  user: User | null
  broker: Broker | null
  loading: boolean
  signIn: (brokerId: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshBroker: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function loadBroker(userId: string): Promise<Broker | null> {
  return fetchBrokerForUser(userId)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [broker, setBroker] = useState<Broker | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshBroker = useCallback(async () => {
    const userId = session?.user.id
    if (!userId) {
      setBroker(null)
      return
    }

    const profile = await loadBroker(userId)
    setBroker(profile)
  }, [session?.user.id])

  useEffect(() => {
    let active = true

    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!active) return

      setSession(data.session)

      if (data.session?.user) {
        const profile = await loadBroker(data.session.user.id)
        if (active) setBroker(profile)
      }

      if (active) setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)

      if (nextSession?.user) {
        const profile = await loadBroker(nextSession.user.id)
        if (active) setBroker(profile)
      } else if (active) {
        setBroker(null)
      }

      if (active) setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (brokerId: string, password: string) => {
    const trimmedId = brokerId.trim()
    const email = trimmedId.includes('@')
      ? trimmedId
      : `${trimmedId.toLowerCase()}@realestate-app.com`

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setBroker(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      broker,
      loading,
      signIn,
      signOut,
      refreshBroker,
    }),
    [session, broker, loading, signIn, signOut, refreshBroker],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
