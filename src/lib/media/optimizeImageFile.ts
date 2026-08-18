export const MAX_IMAGE_EDGE = 1920
/** Stay under typical reverse-proxy defaults (1–8MB) while keeping editor quality. */
export const TARGET_IMAGE_BYTES = 900 * 1024
const MIN_IMAGE_COMPRESSION_BYTES = 400 * 1024

const QUALITY_STEPS = [0.82, 0.72, 0.6, 0.5]

export const scaledImageDimensions = (width: number, height: number) => {
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height, 1))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export const isImageFile = (file: File) =>
  file.type.toLowerCase().startsWith('image/') || /\.(avif|bmp|jpe?g|png|webp)$/i.test(file.name)

export const isOptimizableImageFile = (file: File) => {
  if (!isImageFile(file) || file.size < MIN_IMAGE_COMPRESSION_BYTES) return false
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  if (type === 'image/gif' || name.endsWith('.gif')) return false
  if (type === 'image/svg+xml' || name.endsWith('.svg')) return false
  return true
}

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })

const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('webp')) return 'webp'
  if (mimeType.includes('png')) return 'png'
  return 'jpg'
}

const compressImage = async (file: File, signal?: AbortSignal): Promise<File> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return file
  if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const { width, height } = scaledImageDimensions(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const mimeCandidates = ['image/webp', 'image/jpeg']

  let best: Blob | null = null
  try {
    outer: for (const mimeType of mimeCandidates) {
      if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError')
      for (const quality of QUALITY_STEPS) {
        const blob = await canvasToBlob(canvas, mimeType, quality)
        if (!blob) continue
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= TARGET_IMAGE_BYTES) {
          best = blob
          break outer
        }
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return file
  }

  if (!best || best.size >= file.size * 0.95) return file

  const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image'
  return new File([best], `${baseName}.${extensionForMime(best.type)}`, {
    type: best.type,
    lastModified: file.lastModified,
  })
}

export const optimizeImageFile = async (file: File, signal?: AbortSignal): Promise<File> => {
  if (!isOptimizableImageFile(file)) return file
  try {
    return await compressImage(file, signal)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return file
  }
}
