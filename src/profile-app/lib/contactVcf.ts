import type { SaveContactCardData, SaveContactResponse } from '@/interfaces/api/saveContact'
import { getOrCreateGuestId } from '@/profile-app/lib/guestId'
import { baseUrl } from '@/redux/api/publicApi'

const MAX_VCF_PHOTO_BYTES = 1_200_000
const VCF_LINE_LIMIT = 75
const APPLE_SAFE_PHOTO_TYPES = new Set(['JPEG', 'PNG'])

export class SaveContactError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'SaveContactError'
    this.status = status
  }
}

export async function fetchSaveContactData(profileId: string): Promise<SaveContactCardData> {
  const trimmedId = profileId.trim()
  if (!trimmedId) throw new SaveContactError('Profile ID is required')

  const guestId = getOrCreateGuestId()
  const query = guestId ? `?visitor_id=${encodeURIComponent(guestId)}` : ''
  const response = await fetch(`${baseUrl}/save-contact/${encodeURIComponent(trimmedId)}${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    let message = 'Failed to load contact details'
    try {
      const payload = (await response.json()) as { message?: string; error?: string }
      if (typeof payload.message === 'string') message = payload.message
      else if (typeof payload.error === 'string') message = payload.error
    } catch {
      /* ignore parse errors */
    }
    throw new SaveContactError(message, response.status)
  }

  const payload = (await response.json()) as SaveContactResponse
  const contact = payload.data?.action_buttons?.save_contact?.data
  if (!contact?.name) {
    throw new SaveContactError('Contact details are unavailable')
  }

  return contact
}

function escapeVcfValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function splitFullName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] }
}

function normalizeWebsite(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, '')
  return `https://${trimmed.replace(/\/$/, '')}`
}

export function foldVcfLine(line: string, limit = VCF_LINE_LIMIT): string {
  if (line.length <= limit) return line
  const chunks = [line.slice(0, limit)]
  let remaining = line.slice(limit)
  while (remaining.length) {
    chunks.push(` ${remaining.slice(0, limit - 1)}`)
    remaining = remaining.slice(limit - 1)
  }
  return chunks.join('\r\n')
}

function isVideoImageUrl(url: string): boolean {
  return (
    /\.(mp4|webm|mov|m4v|ogv|ogg|avi|mkv)(\?|#|$)/i.test(url) ||
    /\/(backgroundVideos|videoExplainers|videos)\//i.test(url)
  )
}

export function absoluteContactImageUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed || isVideoImageUrl(trimmed)) return ''
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) {
    if (typeof window !== 'undefined' && window.location?.origin) return `${window.location.origin}${trimmed}`
    return `https://app.vbizme.com${trimmed}`
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return ''
}

export function contactPhotoCandidateUrls(contact: Pick<SaveContactCardData, 'imageUrl' | 'imageUrls'>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of [contact.imageUrl, ...(contact.imageUrls || [])]) {
    const url = absoluteContactImageUrl(raw || '')
    if (!url || seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

export type VcfPhoto = { base64: string; type: 'JPEG' | 'PNG' }

function vcfPhotoType(type?: string | null): 'JPEG' | 'PNG' | 'GIF' | 'WEBP' {
  const upper = String(type || '').toUpperCase()
  if (upper === 'PNG') return 'PNG'
  if (upper === 'GIF') return 'GIF'
  if (upper === 'WEBP') return 'WEBP'
  return 'JPEG'
}

/** iPhone, iPad, iPod, and iPadOS (MacIntel + touch). Mac Safari also needs a real .vcf URL. */
export function looksLikeAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
  return /Macintosh|Mac OS X/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Firefox/i.test(ua)
}

export function looksLikeAppleMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

async function decodeImageToJpegBase64(base64: string, sourceType: string): Promise<string | null> {
  if (typeof document === 'undefined') return null
  try {
    const mime =
      sourceType === 'PNG'
        ? 'image/png'
        : sourceType === 'GIF'
          ? 'image/gif'
          : sourceType === 'WEBP'
            ? 'image/webp'
            : 'image/jpeg'
    const blob = await (await fetch(`data:${mime};base64,${base64}`)).blob()
    const bitmap = await createImageBitmap(blob)
    const maxEdge = 720
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const marker = 'base64,'
    const idx = jpegDataUrl.indexOf(marker)
    if (idx < 0) return null
    return jpegDataUrl.slice(idx + marker.length).replace(/\s+/g, '')
  } catch {
    return null
  }
}

async function fetchImageAsBase64(imageUrl: string): Promise<VcfPhoto | null> {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    const response = await fetch(proxyUrl, { headers: { Accept: 'application/json' } })
    if (!response.ok) return null

    const data = (await response.json()) as { base64?: string; type?: string }
    if (!data.base64) return null
    let type = vcfPhotoType(data.type)
    let base64 = data.base64.replace(/\s+/g, '')

    if (!APPLE_SAFE_PHOTO_TYPES.has(type)) {
      const jpeg = await decodeImageToJpegBase64(base64, type)
      if (!jpeg) return null
      base64 = jpeg
      type = 'JPEG'
    }

    let bytes = Math.ceil((base64.length * 3) / 4)
    if (bytes > MAX_VCF_PHOTO_BYTES) {
      const jpeg = await decodeImageToJpegBase64(base64, type)
      if (!jpeg) return null
      base64 = jpeg
      type = 'JPEG'
      bytes = Math.ceil((base64.length * 3) / 4)
      if (bytes > MAX_VCF_PHOTO_BYTES) return null
    }

    return { base64, type: type === 'PNG' ? 'PNG' : 'JPEG' }
  } catch {
    return null
  }
}

export type ContactVcfPlatform = 'apple' | 'android'

/**
 * iPhone and Mac Contacts show the group label from X-ABLabel.
 * Android Contacts ignores that label and saves every URL row as Website.
 * Android only keeps a custom name from X-ANDROID-CUSTOM (type 0 = custom label).
 */
function pushAppleLabeledUrl(lines: string[], item: number, url: string, label: string) {
  lines.push(`item${item}.URL:${escapeVcfValue(url)}`)
  lines.push(`item${item}.X-ABLabel:${escapeVcfValue(label)}`)
}

function pushAndroidCustomUrl(lines: string[], url: string, label: string) {
  const fields = ['vnd.android.cursor.item/website', url, '0', label].map(escapeVcfValue)
  lines.push(`X-ANDROID-CUSTOM:${fields.join(';')}`)
}

function buildNote(contact: SaveContactCardData): string {
  const parts: string[] = []
  if (contact.note?.trim()) parts.push(contact.note.trim())
  if (contact.profileUrl?.trim()) parts.push(`Profile: ${contact.profileUrl.trim()}`)
  return parts.join('\n')
}

/**
 * Apple Contacts is picky: no CHARSET params, no blank lines, vCard 3.0.
 * Android imports the same file.
 */
export function serializeContactVcf(
  contact: SaveContactCardData,
  photo?: VcfPhoto | null,
  options?: { platform?: ContactVcfPlatform }
): string {
  const { first, last } = splitFullName(contact.name)
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0', 'PRODID:-//vBiz Me//Save Contact//EN']

  lines.push(`N:${escapeVcfValue(last)};${escapeVcfValue(first)};;;`)
  lines.push(`FN:${escapeVcfValue(contact.name)}`)

  if (contact.company?.trim()) lines.push(`ORG:${escapeVcfValue(contact.company.trim())}`)
  if (contact.profession?.trim()) lines.push(`TITLE:${escapeVcfValue(contact.profession.trim())}`)
  if (contact.phone?.trim()) lines.push(`TEL;TYPE=CELL:${escapeVcfValue(contact.phone.trim())}`)
  if (contact.email?.trim()) lines.push(`EMAIL;TYPE=INTERNET:${escapeVcfValue(contact.email.trim())}`)
  const platform = options?.platform === 'android' ? 'android' : 'apple'
  const website = contact.website?.trim() ? normalizeWebsite(contact.website) : ''
  const profileUrl = contact.profileUrl?.trim() || ''
  const cardLink = profileUrl && profileUrl.replace(/\/$/, '') !== website ? profileUrl : ''
  if (platform === 'android') {
    if (website) lines.push(`URL:${escapeVcfValue(website)}`)
    if (cardLink) pushAndroidCustomUrl(lines, cardLink, 'vCard URL')
  } else {
    let urlItem = 1
    if (website) pushAppleLabeledUrl(lines, urlItem++, website, 'Website')
    if (cardLink) pushAppleLabeledUrl(lines, urlItem, cardLink, 'vCard URL')
  }
  if (contact.address?.trim()) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVcfValue(contact.address.trim())};;;;`)
  }

  const note = buildNote(contact)
  if (note) lines.push(`NOTE:${escapeVcfValue(note)}`)
  if (contact.gender?.trim()) lines.push(`X-GENDER:${escapeVcfValue(contact.gender.trim())}`)

  if (photo?.base64) {
    lines.push(foldVcfLine(`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.base64.replace(/\s+/g, '')}`))
  }

  lines.push(
    `REV:${new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')}`
  )
  lines.push('END:VCARD')
  return `${lines.join('\r\n')}\r\n`
}

export async function buildContactVcf(
  contact: SaveContactCardData,
  photoFetcher: (url: string) => Promise<VcfPhoto | null> = fetchImageAsBase64
): Promise<string> {
  let photo: VcfPhoto | null = null
  for (const url of contactPhotoCandidateUrls(contact)) {
    photo = await photoFetcher(url)
    if (photo) break
  }
  return serializeContactVcf(contact, photo)
}

export function vcfFilenameFromName(name?: string | null): string {
  const safe = (name?.trim() || 'contact')
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48)
  return `${safe || 'contact'}.vcf`
}

export type ContactVcfGuestFields = {
  fullName?: string
  phone?: string
  email?: string
  cardSlug?: string
}

export function contactVcfApiUrl(profileId: string, filename?: string, guest?: ContactVcfGuestFields): string {
  const params = new URLSearchParams()
  const guestId = getOrCreateGuestId()
  if (guestId) params.set('visitor_id', guestId)
  if (filename?.trim()) params.set('filename', filename.trim())
  if (guest?.fullName?.trim()) params.set('full_name', guest.fullName.trim().slice(0, 200))
  if (guest?.phone?.trim()) params.set('phone', guest.phone.trim().slice(0, 40))
  if (guest?.email?.trim()) params.set('email', guest.email.trim().slice(0, 200))
  if (guest?.cardSlug?.trim()) params.set('card_slug', guest.cardSlug.trim().slice(0, 120))
  const query = params.toString()
  return `/api/save-contact-vcf/${encodeURIComponent(profileId.trim())}${query ? `?${query}` : ''}`
}

/**
 * Same-origin .vcf in the tap turn — no cross-origin fetch (avoids CORS
 * "Failed to fetch"). iPhone/Safari navigate so Contacts can open the file;
 * Android/Chrome use a same-origin download attribute.
 */
export function openContactVcfFromApi(profileId: string, filename?: string, guest?: ContactVcfGuestFields): void {
  const url = contactVcfApiUrl(profileId, filename, guest)
  if (looksLikeAppleDevice()) {
    window.location.assign(url)
    return
  }

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename?.trim() || 'contact.vcf'
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export async function downloadContactVcf(vcfContent: string, filename = 'contact.vcf'): Promise<void> {
  const safeName = filename.endsWith('.vcf') ? filename : `${filename}.vcf`
  const mime = looksLikeAppleDevice() ? 'text/x-vcard;charset=utf-8' : 'text/vcard;charset=utf-8'
  const blob = new Blob([vcfContent], { type: mime })
  const file = new File([blob], safeName, { type: looksLikeAppleDevice() ? 'text/x-vcard' : 'text/vcard' })

  const nav = window.navigator as Navigator & {
    msSaveOrOpenBlob?: (file: Blob, fileName: string) => void
    canShare?: (data?: ShareData) => boolean
  }

  if (looksLikeAppleMobile() && typeof nav.share === 'function' && typeof nav.canShare === 'function') {
    try {
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: file.name })
        return
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }

  if (typeof nav.msSaveOrOpenBlob === 'function') {
    nav.msSaveOrOpenBlob(blob, file.name)
    return
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function downloadProfileContactVcf(
  profileId: string,
  filename?: string,
  guest?: ContactVcfGuestFields
): Promise<void> {
  const trimmed = profileId.trim()
  if (!trimmed) throw new SaveContactError('Profile ID is required')
  openContactVcfFromApi(trimmed, filename, guest)
}
