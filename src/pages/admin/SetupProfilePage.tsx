import { FormEvent, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ensureBrokerProfile } from '@/lib/broker'

export function SetupProfilePage() {
  const { user, refreshBroker } = useAuth()
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return

    setError(null)
    setSubmitting(true)

    try {
      await ensureBrokerProfile(user.id, companyName)
      await refreshBroker()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create profile.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-8">
      <h2 className="text-3xl font-semibold text-stone-900">Set up your profile</h2>
      <p className="mt-2 text-lg text-stone-600">
        Enter your company name to finish account setup.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">
            Company name
          </span>
          <input
            type="text"
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-stone-900 px-4 py-4 text-xl font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
