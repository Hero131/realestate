import { normalizeHostname } from '@/lib/hostname'
import { supabase } from '@/lib/supabase'
import type { Domain } from '@/types/database'

export async function fetchBrokerDomains(brokerId: string): Promise<Domain[]> {
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('broker_id', brokerId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function addBrokerDomain(
  brokerId: string,
  rawHostname: string,
  options?: { isPrimary?: boolean },
): Promise<Domain> {
  const hostname = normalizeHostname(rawHostname)
  const existing = await fetchBrokerDomains(brokerId)
  const shouldBePrimary = options?.isPrimary ?? existing.length === 0

  if (shouldBePrimary && existing.length > 0) {
    const { error: clearError } = await supabase
      .from('domains')
      .update({ is_primary: false })
      .eq('broker_id', brokerId)

    if (clearError) throw clearError
  }

  const { data, error } = await supabase
    .from('domains')
    .insert({
      broker_id: brokerId,
      hostname,
      is_primary: shouldBePrimary,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBrokerDomain(domainId: string): Promise<void> {
  const { error } = await supabase.from('domains').delete().eq('id', domainId)
  if (error) throw error
}

export async function setPrimaryBrokerDomain(
  brokerId: string,
  domainId: string,
): Promise<void> {
  const { error: clearError } = await supabase
    .from('domains')
    .update({ is_primary: false })
    .eq('broker_id', brokerId)

  if (clearError) throw clearError

  const { error: setError } = await supabase
    .from('domains')
    .update({ is_primary: true })
    .eq('id', domainId)
    .eq('broker_id', brokerId)

  if (setError) throw setError
}
