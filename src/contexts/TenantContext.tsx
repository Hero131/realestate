import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getDevHostnameHint, getRequestHostname } from '@/lib/hostname'
import { resolveTenantBroker, type TenantBroker, type TenantDomain } from '@/lib/tenant'

type TenantContextValue = {
  broker: TenantBroker | null
  domain: TenantDomain | null
  hostname: string
  loading: boolean
  error: string | null
  devHint: string | null
  refreshTenant: () => Promise<void>
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [broker, setBroker] = useState<TenantBroker | null>(null)
  const [domain, setDomain] = useState<TenantDomain | null>(null)
  const [hostname, setHostname] = useState(getRequestHostname)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [devHint, setDevHint] = useState<string | null>(getDevHostnameHint)

  const refreshTenant = useCallback(async () => {
    const requestHostname = getRequestHostname()
    setHostname(requestHostname)
    setDevHint(getDevHostnameHint())
    setLoading(true)
    setError(null)

    try {
      const tenant = await resolveTenantBroker()

      if (!tenant) {
        setBroker(null)
        setDomain(null)
        setError('This domain is not linked to a broker yet.')
        return
      }

      setBroker(tenant.broker)
      setDomain(tenant.domain)
    } catch (err) {
      setBroker(null)
      setDomain(null)
      setError(err instanceof Error ? err.message : 'Could not load broker.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshTenant()
  }, [refreshTenant])

  const value = useMemo(
    () => ({
      broker,
      domain,
      hostname,
      loading,
      error,
      devHint,
      refreshTenant,
    }),
    [broker, domain, hostname, loading, error, devHint, refreshTenant],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}
