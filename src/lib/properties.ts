import { supabase } from '@/lib/supabase'
import type { NearbyAmenity, Property, PropertyImage } from '@/types/database'

export type CatalogProperty = Property & {
  property_images: Pick<PropertyImage, 'id' | 'public_url' | 'sort_order' | 'alt_text'>[]
}

export type PropertyDetails = CatalogProperty & {
  nearby_amenities: NearbyAmenity[]
}

export type CatalogFilters = {
  location: string
  propertyType: string
  maxBudget: string
}

export function getPrimaryImage(
  images: CatalogProperty['property_images'],
): Pick<PropertyImage, 'id' | 'public_url' | 'sort_order' | 'alt_text'> | null {
  if (images.length === 0) return null
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0]
}

export async function fetchPublishedProperties(
  brokerId: string,
): Promise<CatalogProperty[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      '*, property_images(id, public_url, sort_order, alt_text)',
    )
    .eq('broker_id', brokerId)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchPropertyDetails(
  brokerId: string,
  propertyId: string,
): Promise<PropertyDetails | null> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      '*, property_images(id, public_url, sort_order, alt_text), nearby_amenities(*)',
    )
    .eq('broker_id', brokerId)
    .eq('id', propertyId)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    ...data,
    nearby_amenities: [...(data.nearby_amenities ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
    property_images: [...(data.property_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  }
}

export function filterProperties(
  properties: CatalogProperty[],
  filters: CatalogFilters,
): CatalogProperty[] {
  const locationQuery = filters.location.trim().toLowerCase()
  const maxBudget = filters.maxBudget.trim()
    ? Number.parseInt(filters.maxBudget, 10)
    : null

  return properties.filter((property) => {
    if (
      filters.propertyType &&
      property.property_type !== filters.propertyType
    ) {
      return false
    }

    if (
      locationQuery &&
      !property.location.toLowerCase().includes(locationQuery)
    ) {
      return false
    }

    if (maxBudget != null && !Number.isNaN(maxBudget)) {
      const listingMin = property.price_min
      const listingMax = property.price_max ?? property.price_min

      if (listingMin == null && listingMax == null) {
        return true
      }

      const effectiveMin = listingMin ?? listingMax
      if (effectiveMin != null && effectiveMin > maxBudget) {
        return false
      }
    }

    return true
  })
}
