import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_JPEG_QUALITY,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_IMAGE_WIDTH,
  type AllowedImageType,
} from '@/lib/imageConstants'

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return 'Use JPG, PNG, or WebP images only.'
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return 'Image is too large. Maximum size is 15 MB.'
  }

  return null
}

export async function compressImage(file: File): Promise<Blob> {
  const validationError = validateImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Could not prepare image for compression.')
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', IMAGE_JPEG_QUALITY)
  })

  if (!blob) {
    throw new Error('Could not compress image.')
  }

  return blob
}

export function buildPropertyImagePath(
  brokerId: string,
  propertyId: string,
  fileName: string,
): string {
  return `${brokerId}/${propertyId}/${fileName}`
}
