import { useEffect, useRef, useState } from 'react'
import {
  deletePropertyImage,
  fetchPropertyImages,
  uploadPropertyImage,
} from '@/lib/propertyImages'
import type { PropertyImage } from '@/types/database'

type PropertyImagesSectionProps = {
  brokerId: string
  propertyId: string
}

export function PropertyImagesSection({
  brokerId,
  propertyId,
}: PropertyImagesSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<PropertyImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchPropertyImages(propertyId)
        if (active) setImages(data)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load images.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [propertyId])

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return

    setUploading(true)
    setError(null)

    const files = Array.from(fileList)
    let nextSortOrder =
      images.length > 0 ? Math.max(...images.map((image) => image.sort_order)) + 1 : 0

    try {
      const uploaded: PropertyImage[] = []

      for (const file of files) {
        const image = await uploadPropertyImage(
          brokerId,
          propertyId,
          file,
          nextSortOrder,
        )
        uploaded.push(image)
        nextSortOrder += 1
      }

      setImages((current) => [...current, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload images.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(image: PropertyImage) {
    if (!window.confirm('Remove this image?')) return

    setError(null)

    try {
      await deletePropertyImage(image)
      setImages((current) => current.filter((item) => item.id !== image.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete image.')
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900">Property photos</h2>
        <p className="mt-2 text-lg text-stone-600">
          Images are resized and compressed before upload.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => handleFilesSelected(event.target.files)}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border-2 border-dashed border-stone-300 px-6 py-8 text-lg font-medium text-stone-800 hover:border-stone-500 hover:bg-stone-50 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {uploading ? 'Uploading…' : 'Upload photos'}
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-lg text-red-700">{error}</p>
      )}

      {loading && <p className="text-lg text-stone-600">Loading photos…</p>}

      {!loading && images.length === 0 && (
        <p className="text-lg text-stone-600">No photos yet.</p>
      )}

      {images.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <li
              key={image.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
            >
              <img
                src={image.public_url}
                alt={image.alt_text ?? 'Property photo'}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex items-center justify-between gap-3 p-4">
                <span className="text-base text-stone-600">Photo {image.sort_order + 1}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(image)}
                  className="rounded-lg border border-red-300 px-4 py-2 text-base font-medium text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
