import { PROPERTY_TYPES } from '@/lib/constants'
import type { CatalogFilters } from '@/lib/properties'

type PropertyFiltersProps = {
  filters: CatalogFilters
  onChange: (filters: CatalogFilters) => void
}

export function PropertyFilters({ filters, onChange }: PropertyFiltersProps) {
  function updateField<K extends keyof CatalogFilters>(
    key: K,
    value: CatalogFilters[K],
  ) {
    onChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = Boolean(
    filters.location.trim() || filters.propertyType || filters.maxBudget.trim(),
  )

  function handleClear() {
    onChange({
      location: '',
      propertyType: '',
      maxBudget: '',
    })
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-stone-900">Search</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-stone-300 bg-stone-100 px-4 py-2 text-base font-medium text-stone-700 hover:bg-stone-200"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">
            Location
          </span>
          <input
            type="text"
            value={filters.location}
            onChange={(event) => updateField('location', event.target.value)}
            placeholder="Area or city"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">
            Property type
          </span>
          <select
            value={filters.propertyType}
            onChange={(event) => updateField('propertyType', event.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          >
            <option value="">All types</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">
            Max budget (INR)
          </span>
          <input
            type="number"
            min="0"
            value={filters.maxBudget}
            onChange={(event) => updateField('maxBudget', event.target.value)}
            placeholder="e.g. 5000000"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          />
        </label>
      </div>
    </section>
  )
}
