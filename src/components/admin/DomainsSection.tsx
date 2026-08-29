import { FormEvent, useEffect, useState } from 'react'
import {
  addBrokerDomain,
  deleteBrokerDomain,
  fetchBrokerDomains,
  setPrimaryBrokerDomain,
} from '@/lib/domains'
import { isValidHostname, normalizeHostname } from '@/lib/hostname'
import type { Domain } from '@/types/database'

type DomainsSectionProps = {
  brokerId: string
}

export function DomainsSection({ brokerId }: DomainsSectionProps) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [hostname, setHostname] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadDomains() {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchBrokerDomains(brokerId)
      setDomains(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load domains.')
      setDomains([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDomains()
  }, [brokerId])

  async function handleAddDomain(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const normalized = normalizeHostname(hostname)
    if (!isValidHostname(normalized)) {
      setError('Enter a valid domain like sharma.com')
      return
    }

    setSubmitting(true)

    try {
      await addBrokerDomain(brokerId, normalized)
      setHostname('')
      setMessage(`Added ${normalized}. Point this domain to your app in Cloudflare.`)
      await loadDomains()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add domain.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSetPrimary(domain: Domain) {
    setMessage(null)
    setError(null)

    try {
      await setPrimaryBrokerDomain(brokerId, domain.id)
      setMessage(`${domain.hostname} is now the primary domain.`)
      await loadDomains()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update primary domain.')
    }
  }

  async function handleDelete(domain: Domain) {
    if (!window.confirm(`Remove ${domain.hostname}?`)) return

    setMessage(null)
    setError(null)

    try {
      await deleteBrokerDomain(domain.id)
      setMessage(`Removed ${domain.hostname}.`)
      await loadDomains()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove domain.')
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-semibold text-stone-900">Your domains</h2>
      <p className="mt-2 text-lg text-stone-600">
        Customers see your listings on these hostnames.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleAddDomain}>
        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">
            Add domain
          </span>
          <input
            type="text"
            value={hostname}
            onChange={(event) => setHostname(event.target.value)}
            placeholder="sharma.com"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-stone-900 px-6 py-3 text-lg font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {submitting ? 'Adding…' : 'Add domain'}
        </button>
      </form>

      {message && (
        <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-lg text-green-800">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="mt-6 text-lg text-stone-600">Loading domains…</p>}

      {!loading && domains.length === 0 && (
        <p className="mt-6 text-lg text-stone-600">
          No domains yet. Add your first domain above.
        </p>
      )}

      {domains.length > 0 && (
        <ul className="mt-6 divide-y divide-stone-200">
          {domains.map((domain) => (
            <li
              key={domain.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div>
                <p className="text-xl font-semibold text-stone-900">{domain.hostname}</p>
                {domain.is_primary && (
                  <span className="mt-2 inline-block rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
                    Primary
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {!domain.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(domain)}
                    className="rounded-xl border border-stone-300 px-5 py-3 text-lg font-medium text-stone-800 hover:bg-stone-100"
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(domain)}
                  className="rounded-xl border border-red-300 px-5 py-3 text-lg font-medium text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
