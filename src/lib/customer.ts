export function phoneDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

export function telHref(value: string | null | undefined): string | null {
  const digits = phoneDigits(value)
  return digits ? `tel:+${digits}` : null
}

export function whatsappHref(
  value: string | null | undefined,
  message?: string,
): string | null {
  const digits = phoneDigits(value)
  if (!digits) return null

  const url = new URL(`https://wa.me/${digits}`)
  if (message) url.searchParams.set('text', message)
  return url.toString()
}

export function propertyTypeLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function amenityCategoryLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
