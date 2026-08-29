const DEV_HOSTS = new Set(['localhost', '127.0.0.1'])

export function normalizeHostname(value: string): string {
  let host = value.trim().toLowerCase()
  host = host.replace(/^https?:\/\//, '')
  host = host.split('/')[0] ?? host
  host = host.split(':')[0] ?? host
  host = host.replace(/\.+$/, '')
  return host
}

export function isDevHost(hostname: string): boolean {
  return DEV_HOSTS.has(hostname)
}

export function hostnameLookupVariants(hostname: string): string[] {
  const normalized = normalizeHostname(hostname)
  const variants = new Set<string>([normalized])

  if (normalized.startsWith('www.')) {
    variants.add(normalized.slice(4))
  } else if (normalized) {
    variants.add(`www.${normalized}`)
  }

  return [...variants]
}

export function getRequestHostname(): string {
  const hostname = normalizeHostname(window.location.hostname)

  if (!isDevHost(hostname)) {
    return hostname
  }

  const tenantFromQuery = new URLSearchParams(window.location.search).get('tenant')
  if (tenantFromQuery) {
    return normalizeHostname(tenantFromQuery)
  }

  const devHostname = import.meta.env.VITE_DEV_HOSTNAME?.trim()
  if (devHostname) {
    return normalizeHostname(devHostname)
  }

  return hostname
}

export function getDevHostnameHint(): string | null {
  const hostname = normalizeHostname(window.location.hostname)
  if (!isDevHost(hostname)) return null

  if (import.meta.env.VITE_DEV_HOSTNAME?.trim()) return null
  if (new URLSearchParams(window.location.search).get('tenant')) return null

  return 'Set VITE_DEV_HOSTNAME in .env or add ?tenant=your-domain.com to the URL.'
}

export function isValidHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname)
  if (!normalized || normalized.includes(' ') || normalized.includes('/')) {
    return false
  }

  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
    normalized,
  )
}
