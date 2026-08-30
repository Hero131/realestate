import { FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [brokerId, setBrokerId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/admin'

  if (session) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signIn(brokerId, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid Broker ID or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-stone-900">Broker login</h1>
        <p className="mt-2 text-lg text-stone-600">
          Enter your Broker ID and password to manage listings.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">
              Broker ID
            </span>
            <input
              type="text"
              required
              value={brokerId}
              onChange={(event) => setBrokerId(event.target.value)}
              placeholder="e.g. admin1"
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-stone-900 px-4 py-4 text-xl font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'LOGIN'}
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 inline-block text-lg text-stone-500 hover:text-stone-800"
        >
          Back to site
        </Link>
      </div>
    </div>
  )
}
