import { buildPropertyImagePath, compressImage } from '@/lib/imageCompression'
import { PROPERTY_IMAGES_BUCKET } from '@/lib/imageConstants'
import { supabase } from '@/lib/supabase'
import type { PropertyImage } from '@/types/database'

export async function fetchPropertyImages(
  propertyId: string,
): Promise<PropertyImage[]> {
  const { data, error } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', propertyId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function uploadPropertyImage(
  brokerId: string,
  propertyId: string,
  file: File,
  sortOrder: number,
): Promise<PropertyImage> {
  const compressed = await compressImage(file)
  const fileName = `${crypto.randomUUID()}.jpg`
  const storagePath = buildPropertyImagePath(brokerId, propertyId, fileName)

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(storagePath, compressed, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(storagePath)

  const { data, error: insertError } = await supabase
    .from('property_images')
    .insert({
      property_id: propertyId,
      broker_id: brokerId,
      storage_path: storagePath,
      public_url: publicUrl,
      sort_order: sortOrder,
      alt_text: file.name.replace(/\.[^.]+$/, ''),
    })
    .select()
    .single()

  if (insertError) {
    await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([storagePath])
    throw insertError
  }

  return data
}

export async function deletePropertyImage(image: PropertyImage): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .remove([image.storage_path])

  if (storageError) throw storageError

  const { error: deleteError } = await supabase
    .from('property_images')
    .delete()
    .eq('id', image.id)

  if (deleteError) throw deleteError
}

export async function deletePropertyImages(images: PropertyImage[]): Promise<void> {
  if (images.length === 0) return

  const storagePaths = images.map((image) => image.storage_path)

  const { error: storageError } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .remove(storagePaths)

  if (storageError) throw storageError
}

export async function fetchPropertyImagesForCleanup(
  propertyId: string,
): Promise<PropertyImage[]> {
  return fetchPropertyImages(propertyId)
}
