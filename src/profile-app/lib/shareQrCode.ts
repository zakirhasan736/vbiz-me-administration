import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import QRCode from 'qrcode'

export type ShareQrCenterSources = {
  imageUrl: string
  videoUrl: string
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

  const mime = payload.type === 'PNG' ? 'image/png' : 'image/jpeg'
  return loadImageDirect(`data:${mime};base64,${payload.base64}`, false)
}

/** Load an image for canvas compositing — uses server proxy for external hosts to avoid CORS taint. */
async function loadImageForCanvas(src: string): Promise<HTMLImageElement> {
  const trimmed = src.trim()
  if (!trimmed) throw new Error('Empty image URL')

  if (trimmed.startsWith('data:')) {
    return loadImageDirect(trimmed, false)
  }

  if (trimmed.startsWith('/')) {
    return loadImageDirect(trimmed, false)
  }

  if (trimmed.startsWith('https://app.vbizme.com/')) {
    try {
      return await loadImageViaProxy(trimmed)
    } catch {
      return loadImageDirect(trimmed, true)
    }
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return loadImageDirect(trimmed, true)
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
        if (videoSrc.startsWith('https://app.vbizme.com/')) {
          const response = await fetch(`/api/proxy-media?url=${encodeURIComponent(videoSrc)}`)
          if (!response.ok) throw new Error('Proxy media fetch failed')
          const blob = await response.blob()
          objectUrl = URL.createObjectURL(blob)
          video.src = objectUrl
          return
        }

        video.crossOrigin = 'anonymous'
        video.src = videoSrc
      } catch (error) {
        cleanup()
        reject(error)
      }
    })()
  })
}

async function resolveCenterImage(centerImageUrl?: string, centerVideoUrl?: string): Promise<HTMLImageElement | null> {
  const imageSrc = centerImageUrl?.trim()
  if (imageSrc) {
    try {
      return await loadImageForCanvas(imageSrc)
    } catch {
      /* try video fallback */
    }
  }

  const videoSrc = centerVideoUrl?.trim()
  if (videoSrc && isVideoAvatarSrc(videoSrc)) {
    try {
      return await captureVideoFrame(videoSrc)
    } catch {
      /* no center image */
    }
  }

  return null
}

function isStaticImageUrl(value?: string): value is string {
  const src = value?.trim()
  if (!src) return false
  if (isVideoAvatarSrc(src)) return false
  return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:')
}

/** Company logo first, then static profile image; video URL returned separately for frame capture. */
export function resolveShareQrCenterSources(
  companyIconUrl?: string,
  profileMediaUrl?: string,
  introVideoUrl?: string
): ShareQrCenterSources {
  if (isStaticImageUrl(companyIconUrl)) {
    return { imageUrl: companyIconUrl.trim(), videoUrl: '' }
  }

  const profile = profileMediaUrl?.trim() ?? ''
  if (isStaticImageUrl(profile)) {
    return { imageUrl: profile, videoUrl: '' }
  }
  if (profile && isVideoAvatarSrc(profile)) {
    return { imageUrl: '', videoUrl: profile }
  }

  const intro = introVideoUrl?.trim() ?? ''
  if (intro && isVideoAvatarSrc(intro)) {
    return { imageUrl: '', videoUrl: intro }
  }

  return { imageUrl: '', videoUrl: '' }
}

/** @deprecated Use resolveShareQrCenterSources */
export function resolveShareQrCenterImage(companyIconUrl?: string, profileMediaUrl?: string): string {
  return resolveShareQrCenterSources(companyIconUrl, profileMediaUrl).imageUrl
}

function drawImageContained(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imgRatio = image.naturalWidth / image.naturalHeight
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
  const designation = isVisible('MyInfo Designation') ? personal.designation?.trim() : ''
  const company = isVisible('MyInfo Company') ? personal.company?.trim() : ''
  const profession = isVisible('MyInfo Profession') ? personal.profession?.trim() : ''

  if (designation && company) return `${designation} of ${company}`
  if (designation) return designation
  if (profession && company) return `${profession} at ${company}`
  return profession || company || ''
}

type GenerateShareQrOptions = {
  url: string
  foregroundColor: string
  centerImageUrl?: string
  centerVideoUrl?: string
  size?: number
}

export async function generateShareQrDataUrl({
  url,
  foregroundColor,
  centerImageUrl,
  centerVideoUrl,
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

  const centerImage = await resolveCenterImage(centerImageUrl, centerVideoUrl)
  if (!centerImage) return canvas.toDataURL('image/png')

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.toDataURL('image/png')

  const logoSize = canvas.width * 0.22
  const x = (canvas.width - logoSize) / 2
  const y = (canvas.height - logoSize) / 2
  const pad = logoSize * 0.14
  const radius = logoSize * 0.18

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2, radius)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, logoSize, logoSize, radius * 0.85)
  ctx.clip()
  drawImageContained(ctx, centerImage, x, y, logoSize, logoSize)
  ctx.restore()

  return canvas.toDataURL('image/png')
}
