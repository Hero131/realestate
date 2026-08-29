import { supabase } from '@/lib/supabase'
import type { Broker } from '@/types/database'

export async function fetchBrokerForUser(userId: string): Promise<Broker | null> {
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function ensureBrokerProfile(
  userId: string,
  companyName: string,
): Promise<Broker> {
  const existing = await fetchBrokerForUser(userId)
  if (existing) return existing

  const { data, error } = await supabase
    .from('brokers')
    .insert({
      auth_user_id: userId,
      company_name: companyName.trim(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBrokerProfile(
  brokerId: string,
  updates: Pick<Broker, 'company_name' | 'phone' | 'whatsapp'>,
): Promise<Broker> {
  const { data, error } = await supabase
    .from('brokers')
    .update({
      company_name: updates.company_name.trim(),
      phone: updates.phone?.trim() || null,
      whatsapp: updates.whatsapp?.trim() || null,
    })
    .eq('id', brokerId)
    .select()
    .single()

  if (error) throw error
  return data
}
