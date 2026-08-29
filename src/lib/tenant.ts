import { getRequestHostname, hostnameLookupVariants, normalizeHostname } from '@/lib/hostname'
import { supabase } from '@/lib/supabase'
import type { Broker } from '@/types/database'

export type TenantBroker = Pick<Broker, 'id' | 'company_name' | 'phone' | 'whatsapp'>

export type TenantDomain = {
  id: string
  hostname: string
  is_primary: boolean
}

export type TenantResolution = {
  broker: TenantBroker
  domain: TenantDomain
  hostname: string
}

type DomainRow = TenantDomain & {
  broker_id: string
}

function pickMatchedDomain(rows: DomainRow[], requestedHostname: string): DomainRow {
  const normalizedRequest = normalizeHostname(requestedHostname)

  return (
    rows.find((row) => row.hostname === normalizedRequest) ??
    rows.find((row) => row.is_primary) ??
    rows[0]
  )
}

export async function resolveTenantFromHostname(
  requestedHostname: string,
): Promise<TenantResolution | null> {
  const hostname = normalizeHostname(requestedHostname)
  const variants = hostnameLookupVariants(hostname)

  const { data: rows, error: domainError } = await supabase
    .from('domains')
    .select('id, hostname, is_primary, broker_id')
    .in('hostname', variants)

  if (domainError) throw domainError
  if (!rows || rows.length === 0) return null

  const matchedDomain = pickMatchedDomain(rows, hostname)

  const { data: broker, error: brokerError } = await supabase
    .from('brokers')
    .select('id, company_name, phone, whatsapp')
    .eq('id', matchedDomain.broker_id)
    .maybeSingle()

  if (brokerError) throw brokerError
  if (!broker) return null

  return {
    broker,
    domain: {
      id: matchedDomain.id,
      hostname: matchedDomain.hostname,
      is_primary: matchedDomain.is_primary,
    },
    hostname,
  }
}

export async function resolveTenantBroker(): Promise<TenantResolution | null> {
  return resolveTenantFromHostname(getRequestHostname())
}
