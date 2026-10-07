import type { VcfPhoto } from '@/profile-app/lib/contactVcf'
import sharp from 'sharp'

const MAX_SOURCE_BYTES = 12_000_000
const MAX_JPEG_BYTES = 180_000

const EXACT_HOSTS = new Set([
  'app.vbizme.com',
  'www.app.vbizme.com',
  'vbiz.me',
  'www.vbiz.me',
  'vbizme.com',
  'www.vbizme.com',
  'localhost',
  '127.0.0.1',
  'images.unsplash.com',
  'lh3.googleusercontent.com',
])

const HOST_SUFFIXES = [
  '.amazonaws.com',
  '.cloudfront.net',
  '.digitaloceanspaces.com',
  '.cloudinary.com',
  '.googleusercontent.com',
]

function hostFromEnv(raw?: string | null): string | null {
  const value = raw?.trim()
  if (!value) return null
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function isAllowedContactImageHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase()
  if (!host) return false
  if (EXACT_HOSTS.has(host)) return true
  if (host.endsWith('.vbizme.com') || host.endsWith('.vbiz.me')) return true
  const apiHost = hostFromEnv(process.env.NEXT_PUBLIC_API_URL)
  const appHost = hostFromEnv(process.env.NEXT_PUBLIC_APP_URL)
  if (apiHost && host === apiHost) return true
  if (appHost && host === appHost) return true
  return HOST_SUFFIXES.some((suffix) => host.endsWith(suffix) || host.includes('.s3.'))
}

export function sniffContactImageType(bytes: Uint8Array): 'JPEG' | 'PNG' | 'GIF' | 'WEBP' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'JPEG'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'PNG'
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'GIF'
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'WEBP'
  }
  return null
}

async function renderJpeg(bytes: Uint8Array, edge: number, quality: number): Promise<Buffer> {
  return sharp(bytes, { failOn: 'none', animated: false })
    .rotate()
    .resize(edge, edge, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer()
}

/** Phone contacts accept a small JPEG. WebP, PNG, GIF, and large files are converted. */
export async function jpegPhotoFromImageBytes(bytes: Uint8Array): Promise<VcfPhoto | null> {
  if (!bytes.length || bytes.length > MAX_SOURCE_BYTES) return null
  const kind = sniffContactImageType(bytes)
  if (!kind) return null
  try {
    let edge = 512
    let quality = 82
    let jpeg = await renderJpeg(bytes, edge, quality)
    while (jpeg.length > MAX_JPEG_BYTES && (quality > 52 || edge > 280)) {
      if (quality > 52) quality -= 10
      else edge = Math.round(edge * 0.75)
      jpeg = await renderJpeg(bytes, edge, quality)
    }
    if (!jpeg.length || jpeg.length > MAX_JPEG_BYTES) return null
    if (sniffContactImageType(jpeg) !== 'JPEG') return null
    return { base64: jpeg.toString('base64'), type: 'JPEG' }
  } catch {
    if ((kind === 'JPEG' || kind === 'PNG') && bytes.length <= MAX_JPEG_BYTES) {
      return { base64: Buffer.from(bytes).toString('base64'), type: kind }
    }
    return null
  }
}
