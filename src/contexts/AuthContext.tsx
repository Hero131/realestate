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
import { ensureBrokerProfile, fetchBrokerForUser } from '@/lib/broker'
import { supabase } from '@/lib/supabase'
import type { Broker } from '@/types/database'

type AuthContextValue = {
  session: Session | null
  user: User | null
  broker: Broker | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, companyName: string) => Promise<boolean>
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

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, companyName: string) => {
      const trimmedCompany = companyName.trim()
      if (!trimmedCompany) {
        throw new Error('Company name is required.')
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (error) throw error

      if (data.session?.user) {
        const profile = await ensureBrokerProfile(data.session.user.id, trimmedCompany)
        setBroker(profile)
        return false
      }

      return true
    },
    [],
  )

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
      signUp,
      signOut,
      refreshBroker,
    }),
    [session, broker, loading, signIn, signUp, signOut, refreshBroker],
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
