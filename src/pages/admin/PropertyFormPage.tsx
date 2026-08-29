import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PropertyImagesSection } from '@/components/admin/PropertyImagesSection'
import { useAuth } from '@/contexts/AuthContext'
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type PropertyStatus,
  type PropertyType,
} from '@/lib/constants'
import {
  deletePropertyImages,
  fetchPropertyImagesForCleanup,
} from '@/lib/propertyImages'
import { supabase } from '@/lib/supabase'

type PropertyFormState = {
  title: string
  location: string
  propertyType: PropertyType
  priceMin: string
  priceMax: string
  sizeLabel: string
  bedrooms: string
  parking: string
  bulletFacts: string
  status: PropertyStatus
  isFeatured: boolean
}

const emptyForm: PropertyFormState = {
  title: '',
  location: '',
  propertyType: 'apartment',
  priceMin: '',
  priceMax: '',
  sizeLabel: '',
  bedrooms: '',
  parking: '',
  bulletFacts: '',
  status: 'draft',
  isFeatured: false,
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function parseOptionalPrice(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function PropertyFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { broker } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<PropertyFormState>(emptyForm)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditing || !id) return

    let active = true

    async function loadProperty() {
      if (!id) return

      setLoading(true)
      const { data, error: loadError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!active) return

      if (loadError || !data) {
        setError(loadError?.message ?? 'Property not found.')
        setLoading(false)
        return
      }

      setForm({
        title: data.title,
        location: data.location,
        propertyType: data.property_type as PropertyType,
        priceMin: data.price_min?.toString() ?? '',
        priceMax: data.price_max?.toString() ?? '',
        sizeLabel: data.size_label ?? '',
        bedrooms: data.bedrooms?.toString() ?? '',
        parking: data.parking?.toString() ?? '',
        bulletFacts: data.bullet_facts.join('\n'),
        status: data.status as PropertyStatus,
        isFeatured: data.is_featured,
      })
      setLoading(false)
    }

    loadProperty()

    return () => {
      active = false
    }
  }, [id, isEditing])

  function updateField<K extends keyof PropertyFormState>(
    key: K,
    value: PropertyFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!broker) return

    setError(null)
    setSubmitting(true)

    const payload = {
      broker_id: broker.id,
      title: form.title.trim(),
      location: form.location.trim(),
      property_type: form.propertyType,
      price_min: parseOptionalPrice(form.priceMin),
      price_max: parseOptionalPrice(form.priceMax),
      size_label: form.sizeLabel.trim() || null,
      bedrooms: parseOptionalInt(form.bedrooms),
      parking: parseOptionalInt(form.parking),
      bullet_facts: form.bulletFacts
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      status: form.status,
      is_featured: form.isFeatured,
    }

    try {
      if (isEditing && id) {
        const { error: updateError } = await supabase
          .from('properties')
          .update(payload)
          .eq('id', id)

        if (updateError) throw updateError
        navigate('/admin', { replace: true })
      } else {
        const { data, error: insertError } = await supabase
          .from('properties')
          .insert(payload)
          .select('id')
          .single()

        if (insertError) throw insertError
        navigate(`/admin/properties/${data.id}/edit`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save property.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!id || !window.confirm('Delete this property?')) return

    setDeleting(true)
    setError(null)

    try {
      const images = await fetchPropertyImagesForCleanup(id)

      const { error: deleteError } = await supabase.from('properties').delete().eq('id', id)
      if (deleteError) throw deleteError

      await deletePropertyImages(images)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete property.')
      setDeleting(false)
    }
  }

  async function handleUnpublish() {
    if (!id) return

    setSubmitting(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('properties')
        .update({ status: 'unpublished' })
        .eq('id', id)

      if (updateError) throw updateError
      updateField('status', 'unpublished')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unpublish property.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-xl text-stone-600">Loading property…</p>
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="mb-8">
        <Link to="/admin" className="text-lg text-stone-600 hover:text-stone-900">
          ← Back to dashboard
        </Link>
        <h2 className="mt-4 text-3xl font-semibold text-stone-900">
          {isEditing ? 'Edit property' : 'Add property'}
        </h2>
      </div>

      <form
        className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8"
        onSubmit={handleSubmit}
      >
        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">Title</span>
          <input
            type="text"
            required
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">Location</span>
          <input
            type="text"
            required
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">
            Property type
          </span>
          <select
            value={form.propertyType}
            onChange={(event) =>
              updateField('propertyType', event.target.value as PropertyType)
            }
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">
              Min price (INR)
            </span>
            <input
              type="number"
              min="0"
              value={form.priceMin}
              onChange={(event) => updateField('priceMin', event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">
              Max price (INR)
            </span>
            <input
              type="number"
              min="0"
              value={form.priceMax}
              onChange={(event) => updateField('priceMax', event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">Size</span>
          <input
            type="text"
            value={form.sizeLabel}
            onChange={(event) => updateField('sizeLabel', event.target.value)}
            placeholder="1200 sq ft"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">Bedrooms</span>
            <input
              type="number"
              min="0"
              value={form.bedrooms}
              onChange={(event) => updateField('bedrooms', event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-lg font-medium text-stone-800">Parking</span>
            <input
              type="number"
              min="0"
              value={form.parking}
              onChange={(event) => updateField('parking', event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">
            Key facts (one per line)
          </span>
          <textarea
            rows={5}
            value={form.bulletFacts}
            onChange={(event) => updateField('bulletFacts', event.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
            placeholder={'Corner unit\nEast-facing\nReady to move'}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-lg font-medium text-stone-800">Status</span>
          <select
            value={form.status}
            onChange={(event) =>
              updateField('status', event.target.value as PropertyStatus)
            }
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg outline-none focus:border-stone-500"
          >
            {PROPERTY_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 text-lg text-stone-800">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(event) => updateField('isFeatured', event.target.checked)}
            className="h-5 w-5 rounded border-stone-300"
          />
          Featured on homepage
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700">{error}</p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || deleting}
            className="rounded-xl bg-stone-900 px-6 py-3 text-lg font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add property'}
          </button>

          {isEditing && (
            <>
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={submitting || deleting || form.status === 'unpublished'}
                className="rounded-xl border border-stone-300 px-6 py-3 text-lg font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-60"
              >
                Unpublish
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting || deleting}
                className="rounded-xl border border-red-300 px-6 py-3 text-lg font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </form>

      {isEditing && id && broker && (
        <PropertyImagesSection brokerId={broker.id} propertyId={id} />
      )}

      {!isEditing && (
        <p className="text-lg text-stone-600">
          Save the property first, then add photos on the edit page.
        </p>
      )}
    </div>
  )
}
