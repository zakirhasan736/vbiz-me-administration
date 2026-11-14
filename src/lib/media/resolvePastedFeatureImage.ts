import { displayImageSrc } from '@/lib/media/displayImageSrc'
import type { GalleryLinkPreview } from '@/lib/media/linkPreview'
import { uploadMediaWithProgress } from '@/lib/media/uploadMediaWithProgress'

export type ResolvedPastedFeatureImage = {
  /** Image URL to save as featured media (direct, OG, or re-hosted). */
  imageUrl: string
  /** Where the image came from. */
  source: 'direct' | 'og' | 'hosted'
  /** Full page preview when the paste was a share page, not a file URL. */
  preview?: GalleryLinkPreview
}

function probeImageElement(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.Image !== 'function') {
      resolve(false)
      return
    }
    const image = new window.Image()
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      resolve(ok)
    }
    const timer = window.setTimeout(() => finish(false), 12000)
    image.onload = () => finish(image.naturalWidth > 0)
    image.onerror = () => finish(false)
    image.referrerPolicy = 'no-referrer'
    image.src = url
  })
}

/** True when the browser (or our same-origin proxy) can paint this as an image. */
export async function canLoadAsImage(url: string): Promise<boolean> {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (await probeImageElement(trimmed)) return true
  const proxy = displayImageSrc(trimmed)
  if (proxy !== trimmed && (await probeImageElement(proxy))) return true
  return false
}

export async function fetchLinkPreview(pageUrl: string): Promise<GalleryLinkPreview | null> {
  const response = await fetch(`/api/link-preview?url=${encodeURIComponent(pageUrl)}`)
  if (!response.ok) return null
  const payload = (await response.json()) as GalleryLinkPreview & { error?: string }
  if (!payload?.url && !payload?.image) return null
  return {
    url: payload.url || pageUrl,
    title: payload.title || '',
    description: payload.description || '',
    image: payload.image || '',
    siteName: payload.siteName || '',
  }
}

function extensionForMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('avif')) return 'avif'
  return 'jpg'
}

/**
 * Download a remote image through our proxy and upload it to the card media store.
 * Returns null when proxy or upload fails — caller should keep the remote URL.
 */
export async function rehostRemoteImage(
  imageUrl: string,
  options: { profileId?: string | null; attachmentType?: string; signal?: AbortSignal }
): Promise<string | null> {
  const { profileId, attachmentType, signal } = options
  if (!profileId?.trim()) return null
  try {
    const proxy = `/api/remote-image?url=${encodeURIComponent(imageUrl)}`
    const response = await fetch(proxy, { signal })
    if (!response.ok) return null
    const blob = await response.blob()
    if (!blob.size || !blob.type.startsWith('image/')) return null
    const ext = extensionForMime(blob.type)
    const file = new File([blob], `featured-og.${ext}`, { type: blob.type })
    const uploaded = await uploadMediaWithProgress({
      file,
      profileId,
      attachmentType,
      signal,
    })
    return uploaded.url?.trim() || null
  } catch {
    return null
  }
}

/**
 * Resolve a pasted URL into a featured-media image.
 * 1) Use the URL when it loads as an image (direct or via proxy).
 * 2) Otherwise scrape Open Graph / Twitter / page image from the link.
 * 3) Prefer re-hosting that image to our media URL when a profile id is available.
 */
export async function resolvePastedFeatureImage(
  pageUrl: string,
  options?: { profileId?: string | null; attachmentType?: string; signal?: AbortSignal }
): Promise<ResolvedPastedFeatureImage | null> {
  const url = pageUrl.trim()
  if (!url) return null

  if (await canLoadAsImage(url)) {
    return { imageUrl: url, source: 'direct' }
  }

  const preview = await fetchLinkPreview(url)
  const ogImage = preview?.image?.trim() || ''
  if (!ogImage) return null

  if (!(await canLoadAsImage(ogImage))) {
    // Still return OG URL — public ReliableImage / remote-image may load it even if
    // the editor probe failed (CORS). Prefer hosted copy when possible.
  }

  const hosted = await rehostRemoteImage(ogImage, {
    profileId: options?.profileId,
    attachmentType: options?.attachmentType,
    signal: options?.signal,
  })
  if (hosted) {
    return { imageUrl: hosted, source: 'hosted', preview: preview || undefined }
  }

  return { imageUrl: ogImage, source: 'og', preview: preview || undefined }
}
