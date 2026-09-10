import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import QRCode from 'qrcode'

export type ShareQrCenterSources = {
  imageUrl: string
  videoUrl: string
  /** Still-image candidates in priority order (avatar → profile → About Me → …). */
  imageUrls: string[]
  /** Video candidates when no still image loads. */
  videoUrls: string[]
}

function loadImageDirect(src: string, useCors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (useCors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

async function loadImageViaProxy(httpsUrl: string): Promise<HTMLImageElement> {
  const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(httpsUrl)}`)
  if (!response.ok) throw new Error('Proxy image fetch failed')

  const payload = (await response.json()) as { base64?: string; type?: string }
  if (!payload.base64) throw new Error('Proxy returned no image data')

  const mime =
    payload.type === 'PNG'
      ? 'image/png'
      : payload.type === 'WEBP'
        ? 'image/webp'
        : payload.type === 'GIF'
          ? 'image/gif'
          : 'image/jpeg'
  return loadImageDirect(`data:${mime};base64,${payload.base64}`, false)
}

function toAbsoluteMediaUrl(src: string): string {
  const trimmed = src.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) {
    if (typeof window !== 'undefined' && window.location?.origin) return `${window.location.origin}${trimmed}`
    return `https://app.vbizme.com${trimmed}`
  }
  return trimmed
}

/** Load an image for canvas compositing — prefer server proxy for remote hosts to avoid CORS taint. */
async function loadImageForCanvas(src: string): Promise<HTMLImageElement> {
  const trimmed = toAbsoluteMediaUrl(src)
  if (!trimmed) throw new Error('Empty image URL')

  if (trimmed.startsWith('data:')) {
    return loadImageDirect(trimmed, false)
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return await loadImageViaProxy(trimmed)
    } catch {
      try {
        return await loadImageDirect(trimmed, true)
      } catch {
        return loadImageDirect(trimmed, false)
      }
    }
  }

  if (trimmed.startsWith('/')) {
    return loadImageDirect(trimmed, false)
  }

  throw new Error(`Unsupported image URL: ${trimmed}`)
}

function captureVideoFrame(videoSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let objectUrl: string | null = null
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    const cleanup = () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }

    const onFrameReady = () => {
      try {
        const frameCanvas = document.createElement('canvas')
        frameCanvas.width = video.videoWidth || 320
        frameCanvas.height = video.videoHeight || 320
        const ctx = frameCanvas.getContext('2d')
        if (!ctx) {
          cleanup()
          reject(new Error('Canvas unavailable'))
          return
        }
        ctx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height)
        const dataUrl = frameCanvas.toDataURL('image/png')
        cleanup()
        void loadImageDirect(dataUrl, false).then(resolve).catch(reject)
      } catch (error) {
        cleanup()
        reject(error)
      }
    }

    video.onloadeddata = () => {
      const seekTo = video.duration > 0 ? Math.min(0.5, video.duration * 0.1) : 0
      video.currentTime = seekTo
    }

    video.onseeked = onFrameReady
    video.onerror = () => {
      cleanup()
      reject(new Error(`Failed to load video: ${videoSrc}`))
    }

    void (async () => {
      try {
        const absolute = toAbsoluteMediaUrl(videoSrc)
        if (absolute.startsWith('http://') || absolute.startsWith('https://')) {
          try {
            const response = await fetch(`/api/proxy-media?url=${encodeURIComponent(absolute)}`)
            if (response.ok) {
              const blob = await response.blob()
              objectUrl = URL.createObjectURL(blob)
              video.src = objectUrl
              return
            }
          } catch {
            /* fall through to direct */
          }
          video.crossOrigin = 'anonymous'
          video.src = absolute
          return
        }

        video.src = absolute
      } catch (error) {
        cleanup()
        reject(error)
      }
    })()
  })
}

function createInitialsAvatar(label: string, size = 320): HTMLImageElement | null {
  const text = label
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
  if (!text) return null

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f8fafc'
  ctx.font = `700 ${Math.round(size * 0.38)}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, size / 2, size / 2 + size * 0.03)

  const img = new Image()
  img.src = canvas.toDataURL('image/png')
  return img
}

async function resolveCenterImage(opts: {
  imageUrls?: string[]
  videoUrls?: string[]
  centerImageUrl?: string
  centerVideoUrl?: string
  fallbackInitials?: string
}): Promise<HTMLImageElement | null> {
  const imageUrls = [...(opts.imageUrls || []), ...(opts.centerImageUrl ? [opts.centerImageUrl] : [])]
    .map((url) => url.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  for (const imageSrc of imageUrls) {
    if (seen.has(imageSrc)) continue
    seen.add(imageSrc)
    try {
      return await loadImageForCanvas(imageSrc)
    } catch {
      /* try next candidate */
    }
  }

  const videoUrls = [...(opts.videoUrls || []), ...(opts.centerVideoUrl ? [opts.centerVideoUrl] : [])]
    .map((url) => url.trim())
    .filter((url) => url && isVideoAvatarSrc(url))

  for (const videoSrc of videoUrls) {
    try {
      return await captureVideoFrame(videoSrc)
    } catch {
      /* try next */
    }
  }

  const initials = createInitialsAvatar(opts.fallbackInitials || '')
  if (initials) {
    if (initials.complete) return initials
    await new Promise<void>((resolve) => {
      initials.onload = () => resolve()
      initials.onerror = () => resolve()
    })
    return initials
  }

  return null
}

function isStaticImageUrl(value?: string): value is string {
  const src = value?.trim()
  if (!src) return false
  if (isVideoAvatarSrc(src)) return false
  return (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('/') ||
    src.startsWith('data:') ||
    src.startsWith('//')
  )
}

function pushUnique(out: string[], seen: Set<string>, value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed || seen.has(trimmed)) return
  seen.add(trimmed)
  out.push(trimmed)
}

export type ShareQrCenterSourceInput = {
  /** 1) Dedicated avatar image */
  avatarUrl?: string
  /** 2) Home Profile Image/Video */
  profileMediaUrl?: string
  /** 3) About Me featured media */
  aboutMeMediaUrl?: string
  /** Video fallback after still images (intro / profile video) */
  introVideoUrl?: string
  /** Extra still candidates (company icon, etc.) */
  companyIconUrl?: string
}

/**
 * Share QR center media priority:
 * avatar → profile area image → About Me image → company icon → video fallbacks.
 */
export function resolveShareQrCenterSources(
  companyIconUrlOrInput?: string | ShareQrCenterSourceInput,
  profileMediaUrl?: string,
  introVideoUrl?: string
): ShareQrCenterSources {
  const input: ShareQrCenterSourceInput =
    typeof companyIconUrlOrInput === 'object' && companyIconUrlOrInput !== null
      ? companyIconUrlOrInput
      : {
          companyIconUrl: companyIconUrlOrInput,
          profileMediaUrl,
          introVideoUrl,
        }

  const imageUrls: string[] = []
  const videoUrls: string[] = []
  const seenImages = new Set<string>()
  const seenVideos = new Set<string>()

  const stillPriority = [input.avatarUrl, input.profileMediaUrl, input.aboutMeMediaUrl, input.companyIconUrl]
  for (const candidate of stillPriority) {
    if (isStaticImageUrl(candidate)) pushUnique(imageUrls, seenImages, candidate)
  }

  const videoPriority = [input.avatarUrl, input.profileMediaUrl, input.aboutMeMediaUrl, input.introVideoUrl]
  for (const candidate of videoPriority) {
    const src = candidate?.trim() ?? ''
    if (src && isVideoAvatarSrc(src)) pushUnique(videoUrls, seenVideos, src)
  }

  return {
    imageUrl: imageUrls[0] || '',
    videoUrl: videoUrls[0] || '',
    imageUrls,
    videoUrls,
  }
}

/** @deprecated Use resolveShareQrCenterSources */
export function resolveShareQrCenterImage(companyIconUrl?: string, profileMediaUrl?: string): string {
  return resolveShareQrCenterSources({ companyIconUrl, profileMediaUrl }).imageUrl
}

function drawImageContained(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imgRatio = (image.naturalWidth || image.width) / Math.max(1, image.naturalHeight || image.height || 1)
  const boxRatio = width / height
  let drawW = width
  let drawH = height
  let dx = x
  let dy = y

  if (imgRatio > boxRatio) {
    drawH = width / imgRatio
    dy = y + (height - drawH) / 2
  } else {
    drawW = height * imgRatio
    dx = x + (width - drawW) / 2
  }

  ctx.drawImage(image, dx, dy, drawW, drawH)
}

function drawCenterBadge(ctx: CanvasRenderingContext2D, canvasSize: number, image: HTMLImageElement) {
  const logoSize = canvasSize * 0.28
  const x = (canvasSize - logoSize) / 2
  const y = (canvasSize - logoSize) / 2
  const pad = logoSize * 0.12
  const radius = logoSize * 0.22

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2, radius)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, logoSize, logoSize, radius * 0.9)
  ctx.clip()
  drawImageContained(ctx, image, x, y, logoSize, logoSize)
  ctx.restore()
}

export function formatShareDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  const lastInitial = parts[parts.length - 1]?.[0]?.toUpperCase() ?? ''
  return `${parts[0]} ${lastInitial}.`
}

export function buildShareProfileTitle(
  personal: { designation?: string; profession?: string; company?: string },
  isVisible: (key: string) => boolean
): string {
  const profession = isVisible('MyInfo Profession') ? personal.profession?.trim() : ''
  const designation = isVisible('MyInfo Designation') ? personal.designation?.trim() : ''
  const company = isVisible('MyInfo Company') ? personal.company?.trim() : ''
  const title = profession || designation

  if (title && company) {
    const connector = profession ? 'at' : 'of'
    return `${title} ${connector} ${company}`
  }
  return title || company || ''
}

type GenerateShareQrOptions = {
  url: string
  foregroundColor: string
  centerImageUrl?: string
  centerVideoUrl?: string
  centerImageUrls?: string[]
  centerVideoUrls?: string[]
  /** Initials drawn when no photo/video can be loaded — guarantees a center mark. */
  fallbackInitials?: string
  size?: number
}

export async function generateShareQrDataUrl({
  url,
  foregroundColor,
  centerImageUrl,
  centerVideoUrl,
  centerImageUrls,
  centerVideoUrls,
  fallbackInitials,
  size = 600,
}: GenerateShareQrOptions): Promise<string> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 1,
    color: {
      dark: foregroundColor,
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  })

  const centerImage = await resolveCenterImage({
    imageUrls: centerImageUrls,
    videoUrls: centerVideoUrls,
    centerImageUrl,
    centerVideoUrl,
    fallbackInitials,
  })

  const ctx = canvas.getContext('2d')
  if (!ctx || !centerImage) return canvas.toDataURL('image/png')

  try {
    drawCenterBadge(ctx, canvas.width, centerImage)
  } catch {
    /* tainted canvas — return plain QR rather than failing share */
    return canvas.toDataURL('image/png')
  }

  return canvas.toDataURL('image/png')
}
