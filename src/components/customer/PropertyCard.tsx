import { Link } from 'react-router-dom'
import { propertyTypeLabel } from '@/lib/customer'
import { formatPrice } from '@/lib/constants'
import { getPrimaryImage, type CatalogProperty } from '@/lib/properties'

type PropertyCardProps = {
  property: CatalogProperty
}

export function PropertyCard({ property }: PropertyCardProps) {
  const image = getPrimaryImage(property.property_images)
  const facts = property.bullet_facts.slice(0, 3)

  return (
    <Link
      to={`/properties/${property.id}`}
      className="block overflow-hidden rounded-2xl border border-stone-200 bg-white hover:border-stone-300"
    >
      <div className="aspect-[4/3] bg-stone-200">
        {image ? (
          <img
            src={image.public_url}
            alt={image.alt_text ?? property.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-lg text-stone-500">
            No photo
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-2xl font-semibold text-stone-900">{property.title}</h3>
          {property.is_featured && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
              Featured
            </span>
          )}
        </div>

        <p className="mt-2 text-2xl font-semibold text-stone-900">
          {formatPrice(property.price_min, property.price_max)}
        </p>

        <p className="mt-2 text-xl text-stone-700">{property.location}</p>

        <ul className="mt-4 space-y-2 text-lg text-stone-600">
          <li>{propertyTypeLabel(property.property_type)}</li>
          {property.size_label && <li>{property.size_label}</li>}
          {property.bedrooms != null && <li>{property.bedrooms} bedrooms</li>}
          {property.parking != null && <li>{property.parking} parking</li>}
        </ul>

        {facts.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-stone-100 pt-4 text-lg text-stone-700">
            {facts.map((fact) => (
              <li key={fact}>• {fact}</li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  )
}
