export const MAX_IMAGE_EDGE = 1920
/** Full-bleed profile backgrounds need more pixels for tall phone DPR crops. */
export const MAX_COVER_IMAGE_EDGE = 3840
/** Prefer keeping the short side large enough for ~600 CSS px @3x after cover crop. */
export const MIN_COVER_SHORT_EDGE = 1800
/** Stay under typical reverse-proxy defaults (1–8MB) while keeping editor quality. */
export const TARGET_IMAGE_BYTES = 900 * 1024
export const TARGET_COVER_IMAGE_BYTES = 1800 * 1024
const MIN_IMAGE_COMPRESSION_BYTES = 400 * 1024

const QUALITY_STEPS = [0.82, 0.72, 0.6, 0.5]
const COVER_QUALITY_STEPS = [0.9, 0.82, 0.72, 0.6]

export type ImageOptimizeQuality = 'standard' | 'cover'

export type OptimizeImageFileOptions = {
  signal?: AbortSignal
  /** `cover` keeps a higher long-edge / short-edge budget for wallpaper uploads. */
  quality?: ImageOptimizeQuality
}

export const scaledImageDimensions = (width: number, height: number) => {
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height, 1))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * Cover / wallpaper: prefer a tall short-edge for mobile portrait object-cover,
 * while still capping the long edge so uploads stay manageable.
 */
export const scaledCoverImageDimensions = (width: number, height: number) => {
  const srcW = Math.max(1, width)
  const srcH = Math.max(1, height)
  const srcLong = Math.max(srcW, srcH)
  const srcShort = Math.min(srcW, srcH)

  let scale = Math.min(1, MAX_COVER_IMAGE_EDGE / srcLong)

  // If the short side would fall below the mobile cover budget, keep more pixels
  // (as long as the source actually has them).
  if (srcShort >= MIN_COVER_SHORT_EDGE) {
    const shortAfter = srcShort * scale
    if (shortAfter < MIN_COVER_SHORT_EDGE) {
      scale = Math.min(1, MIN_COVER_SHORT_EDGE / srcShort)
    }
  }

  // Re-cap long edge after boosting short edge.
  if (srcLong * scale > MAX_COVER_IMAGE_EDGE) {
    scale = MAX_COVER_IMAGE_EDGE / srcLong
  }

  return {
    width: Math.max(1, Math.round(srcW * scale)),
    height: Math.max(1, Math.round(srcH * scale)),
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

const compressImage = async (
  file: File,
  signal: AbortSignal | undefined,
  qualityMode: ImageOptimizeQuality
): Promise<File> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return file
  if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const dims =
    qualityMode === 'cover'
      ? scaledCoverImageDimensions(bitmap.width, bitmap.height)
      : scaledImageDimensions(bitmap.width, bitmap.height)
  const { width, height } = dims
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
  const qualitySteps = qualityMode === 'cover' ? COVER_QUALITY_STEPS : QUALITY_STEPS
  const targetBytes = qualityMode === 'cover' ? TARGET_COVER_IMAGE_BYTES : TARGET_IMAGE_BYTES

  let best: Blob | null = null
  try {
    outer: for (const mimeType of mimeCandidates) {
      if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError')
      for (const quality of qualitySteps) {
        const blob = await canvasToBlob(canvas, mimeType, quality)
        if (!blob) continue
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= targetBytes) {
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

export const optimizeImageFile = async (
  file: File,
  signalOrOptions?: AbortSignal | OptimizeImageFileOptions
): Promise<File> => {
  if (!isOptimizableImageFile(file)) return file
  const options: OptimizeImageFileOptions =
    signalOrOptions instanceof AbortSignal
      ? { signal: signalOrOptions }
      : signalOrOptions && typeof signalOrOptions === 'object'
        ? signalOrOptions
        : {}
  try {
    return await compressImage(file, options.signal, options.quality ?? 'standard')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return file
  }
}
