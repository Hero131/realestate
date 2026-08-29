import { Outlet } from 'react-router-dom'
import { useTenant } from '@/contexts/TenantContext'
import { ContactButtons } from '@/components/customer/ContactButtons'

export function CustomerLayout() {
  const { broker, domain, hostname, loading, error, devHint } = useTenant()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <p className="text-xl text-stone-600">Loading properties…</p>
      </div>
    )
  }

  if (error || !broker) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
        <h1 className="text-3xl font-semibold text-stone-900">Site not ready</h1>
        <p className="mt-4 max-w-md text-xl text-stone-600">
          {error ?? 'No broker found for this domain.'}
        </p>
        <p className="mt-3 text-lg text-stone-500">Hostname: {hostname}</p>
        {devHint && (
          <p className="mt-3 max-w-md text-lg text-stone-500">{devHint}</p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <h1 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            {broker.company_name}
          </h1>
          <p className="mt-2 text-xl text-stone-600">Property listings</p>
          {domain && (
            <p className="mt-1 text-base text-stone-500">{domain.hostname}</p>
          )}
          <ContactButtons broker={broker} className="mt-5" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Outlet context={{ broker }} />
      </main>
    </div>
  )
}
