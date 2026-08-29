import { FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const { session, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
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
      if (mode === 'login') {
        await signIn(email, password)
        navigate(redirectTo, { replace: true })
        return
      }

      const needsEmailConfirmation = await signUp(email, password, companyName)
      if (needsEmailConfirmation) {
        setError('Check your email to confirm your account, then log in.')
        setMode('login')
        return
      }

      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-stone-900">
          {mode === 'login' ? 'Broker login' : 'Create broker account'}
        </h1>
        <p className="mt-2 text-lg text-stone-600">
          Manage your property listings.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {mode === 'signup' && (
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
                autoComplete="organization"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">
              Password
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
            {submitting
              ? 'Please wait…'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-lg text-stone-600">
          {mode === 'login' ? 'New broker?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
            }}
            className="font-semibold text-stone-900 underline"
          >
            {mode === 'login' ? 'Create account' : 'Log in'}
          </button>
        </p>

        <Link
          to="/"
          className="mt-4 inline-block text-lg text-stone-500 hover:text-stone-800"
        >
          Back to site
        </Link>
      </div>
    </div>
  )
}
