import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ContactButtons } from '@/components/customer/ContactButtons'
import { useTenant } from '@/contexts/TenantContext'
import { amenityCategoryLabel, propertyTypeLabel } from '@/lib/customer'
import { formatPrice } from '@/lib/constants'
import { fetchPropertyDetails, type PropertyDetails } from '@/lib/properties'

export function PropertyDetailsPage() {
  const { id } = useParams()
  const { broker } = useTenant()
  const [property, setProperty] = useState<PropertyDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    if (!broker?.id || !id) return

    const brokerId = broker.id
    const propertyId = id
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchPropertyDetails(brokerId, propertyId)
        if (!active) return

        if (!data) {
          setProperty(null)
          setError('Property not found.')
        } else {
          setProperty(data)
          setActiveImageIndex(0)
        }
      } catch (err) {
        if (!active) return
        setProperty(null)
        setError(err instanceof Error ? err.message : 'Could not load property.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [broker, id])

  if (loading) {
    return <p className="text-xl text-stone-600">Loading property…</p>
  }

  if (error || !property || !broker) {
    return (
      <div className="space-y-4">
        <Link to="/" className="text-lg text-stone-600 hover:text-stone-900">
          ← Back to listings
        </Link>
        <p className="text-xl text-stone-600">{error ?? 'Property not found.'}</p>
      </div>
    )
  }

  const activeImage = property.property_images[activeImageIndex]
  const whatsappMessage = `Hi, I am interested in ${property.title} in ${property.location}.`

  return (
    <div className="space-y-8">
      <Link to="/" className="inline-block text-lg text-stone-600 hover:text-stone-900">
        ← Back to listings
      </Link>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="aspect-[4/3] bg-stone-200">
          {activeImage ? (
            <img
              src={activeImage.public_url}
              alt={activeImage.alt_text ?? property.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xl text-stone-500">
              No photo
            </div>
          )}
        </div>

        {property.property_images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-4">
            {property.property_images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 ${
                  index === activeImageIndex
                    ? 'border-stone-900'
                    : 'border-stone-200'
                }`}
              >
                <img
                  src={image.public_url}
                  alt={image.alt_text ?? `${property.title} photo ${index + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <h1 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
          {property.title}
        </h1>

        <p className="mt-3 text-3xl font-semibold text-stone-900">
          {formatPrice(property.price_min, property.price_max)}
        </p>

        <p className="mt-3 text-2xl text-stone-700">{property.location}</p>

        <ul className="mt-6 space-y-2 text-xl text-stone-700">
          <li>{propertyTypeLabel(property.property_type)}</li>
          {property.size_label && <li>{property.size_label}</li>}
          {property.bedrooms != null && <li>{property.bedrooms} bedrooms</li>}
          {property.parking != null && <li>{property.parking} parking</li>}
        </ul>

        {property.bullet_facts.length > 0 && (
          <div className="mt-8 border-t border-stone-100 pt-6">
            <h2 className="text-2xl font-semibold text-stone-900">Key facts</h2>
            <ul className="mt-4 space-y-2 text-xl text-stone-700">
              {property.bullet_facts.map((fact) => (
                <li key={fact}>• {fact}</li>
              ))}
            </ul>
          </div>
        )}

        {property.nearby_amenities.length > 0 && (
          <div className="mt-8 border-t border-stone-100 pt-6">
            <h2 className="text-2xl font-semibold text-stone-900">Nearby</h2>
            <ul className="mt-4 space-y-3 text-xl text-stone-700">
              {property.nearby_amenities.map((amenity) => (
                <li key={amenity.id}>
                  • {amenityCategoryLabel(amenity.category)} – {amenity.travel_time}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-stone-900">Contact broker</h2>
        <p className="mt-2 text-xl text-stone-600">
          Speak with {broker.company_name} about this property.
        </p>
        <ContactButtons
          broker={broker}
          whatsappMessage={whatsappMessage}
          className="mt-6"
        />
      </section>
    </div>
  )
}
