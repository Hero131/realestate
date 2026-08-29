import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DomainsSection } from '@/components/admin/DomainsSection'
import { useAuth } from '@/contexts/AuthContext'
import { updateBrokerProfile } from '@/lib/broker'
import { formatPrice, statusLabel } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { Property } from '@/types/database'

export function DashboardPage() {
  const { broker, refreshBroker } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (!broker) return

    setCompanyName(broker.company_name)
    setPhone(broker.phone ?? '')
    setWhatsapp(broker.whatsapp ?? '')
  }, [broker])

  useEffect(() => {
    if (!broker?.id) return

    const brokerId = broker.id

    let active = true

    async function loadProperties() {
      setLoadingProperties(true)
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('broker_id', brokerId)
        .order('updated_at', { ascending: false })

      if (!active) return

      if (error) {
        console.error(error)
        setProperties([])
      } else {
        setProperties(data)
      }

      setLoadingProperties(false)
    }

    loadProperties()

    return () => {
      active = false
    }
  }, [broker])

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault()
    if (!broker) return

    setProfileMessage(null)
    setProfileError(null)
    setSavingProfile(true)

    try {
      await updateBrokerProfile(broker.id, {
        company_name: companyName,
        phone,
        whatsapp,
      })
      await refreshBroker()
      setProfileMessage('Profile saved.')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-stone-900">Your details</h2>
        <p className="mt-2 text-lg text-stone-600">
          Shown on your public property site for Call and WhatsApp.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleProfileSubmit}>
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

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">
              Phone
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
              placeholder="+91 98765 43210"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">
              WhatsApp
            </span>
            <input
              type="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
              placeholder="+91 98765 43210"
            />
          </label>

          {profileMessage && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-lg text-green-800">
              {profileMessage}
            </p>
          )}

          {profileError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700">
              {profileError}
            </p>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-stone-900 px-6 py-3 text-lg font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      {broker && <DomainsSection brokerId={broker.id} />}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">Properties</h2>
            <p className="mt-2 text-lg text-stone-600">
              {loadingProperties
                ? 'Loading…'
                : `${properties.length} listing${properties.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link
            to="/admin/properties/new"
            className="rounded-xl bg-stone-900 px-6 py-3 text-lg font-semibold text-white hover:bg-stone-800"
          >
            Add property
          </Link>
        </div>

        {!loadingProperties && properties.length === 0 && (
          <p className="mt-8 text-lg text-stone-600">
            No properties yet. Add your first listing.
          </p>
        )}

        {properties.length > 0 && (
          <ul className="mt-8 divide-y divide-stone-200">
            {properties.map((property) => (
              <li
                key={property.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div>
                  <h3 className="text-xl font-semibold text-stone-900">
                    {property.title}
                  </h3>
                  <p className="mt-1 text-lg text-stone-600">{property.location}</p>
                  <p className="mt-1 text-lg text-stone-800">
                    {formatPrice(property.price_min, property.price_max)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-stone-100 px-4 py-2 text-base font-medium text-stone-700">
                    {statusLabel(property.status)}
                  </span>
                  <Link
                    to={`/admin/properties/${property.id}/edit`}
                    className="rounded-xl border border-stone-300 px-5 py-3 text-lg font-medium text-stone-800 hover:bg-stone-100"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
