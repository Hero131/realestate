import { useEffect, useMemo, useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { PropertyCard } from '@/components/customer/PropertyCard'
import { PropertyFilters } from '@/components/customer/PropertyFilters'
import {
  fetchPublishedProperties,
  filterProperties,
  type CatalogFilters,
  type CatalogProperty,
} from '@/lib/properties'

const emptyFilters: CatalogFilters = {
  location: '',
  propertyType: '',
  maxBudget: '',
}

export function CatalogPage() {
  const { broker } = useTenant()
  const [properties, setProperties] = useState<CatalogProperty[]>([])
  const [filters, setFilters] = useState<CatalogFilters>(emptyFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!broker?.id) return

    const brokerId = broker.id
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchPublishedProperties(brokerId)
        if (active) setProperties(data)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load properties.')
          setProperties([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [broker])

  const filteredProperties = useMemo(
    () => filterProperties(properties, filters),
    [properties, filters],
  )

  const featuredProperties = useMemo(
    () => filteredProperties.filter((property) => property.is_featured),
    [filteredProperties],
  )

  const otherProperties = useMemo(
    () => filteredProperties.filter((property) => !property.is_featured),
    [filteredProperties],
  )

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <h2 className="text-3xl font-semibold text-stone-900">Find a property</h2>
        <p className="mt-2 text-xl text-stone-600">
          Browse listings from {broker?.company_name}.
        </p>
      </section>

      <PropertyFilters filters={filters} onChange={setFilters} />

      {loading && <p className="text-xl text-stone-600">Loading properties…</p>}

      {error && (
        <p className="rounded-2xl bg-red-50 px-5 py-4 text-xl text-red-700">{error}</p>
      )}

      {!loading && !error && filteredProperties.length === 0 && (
        <p className="text-xl text-stone-600">No properties match your search.</p>
      )}

      {!loading && featuredProperties.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-stone-900">Featured</h2>
          <div className="space-y-5">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}

      {!loading && otherProperties.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-stone-900">
            {featuredProperties.length > 0 ? 'More properties' : 'Properties'}
          </h2>
          <div className="space-y-5">
            {otherProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
