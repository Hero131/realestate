export const PROPERTY_IMAGES_BUCKET = 'property-images'

export const MAX_IMAGE_FILE_SIZE_BYTES = 15 * 1024 * 1024
export const MAX_IMAGE_WIDTH = 1600
export const IMAGE_JPEG_QUALITY = 0.82

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]
