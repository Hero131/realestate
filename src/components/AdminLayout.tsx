import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function AdminLayout() {
  const { broker, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
              Broker Admin
            </p>
            <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
              {broker?.company_name ?? 'Dashboard'}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-xl border border-stone-300 px-5 py-3 text-lg font-medium text-stone-800 hover:bg-stone-100"
          >
            Log out
          </button>
        </div>
      </header>

      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl gap-2 px-4 py-3 sm:px-6">
          <Link
            to="/admin"
            className="rounded-lg px-4 py-2 text-lg font-medium text-stone-700 hover:bg-stone-100"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/properties/new"
            className="rounded-lg px-4 py-2 text-lg font-medium text-stone-700 hover:bg-stone-100"
          >
            Add property
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
