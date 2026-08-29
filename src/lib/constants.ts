export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
] as const

export const PROPERTY_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'unpublished', label: 'Unpublished' },
] as const

export type PropertyType = (typeof PROPERTY_TYPES)[number]['value']
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number]['value']

export function formatPrice(priceMin: number | null, priceMax: number | null): string {
  if (priceMin == null && priceMax == null) return 'Price on request'

  const format = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)

  if (priceMin != null && priceMax != null && priceMin !== priceMax) {
    return `${format(priceMin)} – ${format(priceMax)}`
  }

  return format(priceMin ?? priceMax!)
}

export function statusLabel(status: string): string {
  return PROPERTY_STATUSES.find((item) => item.value === status)?.label ?? status
}
