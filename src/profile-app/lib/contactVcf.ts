import type { SaveContactCardData, SaveContactResponse } from '@/interfaces/api/saveContact'
import { getOrCreateGuestId } from '@/profile-app/lib/guestId'
import { baseUrl } from '@/redux/api/publicApi'

const MAX_VCF_PHOTO_BYTES = 1_500_000
const VCF_LINE_LIMIT = 75

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
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function splitFullName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] }
}

function normalizeWebsite(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
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

function vcfPhotoType(type?: string | null): 'JPEG' | 'PNG' {
  return String(type || '').toUpperCase() === 'PNG' ? 'PNG' : 'JPEG'
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; type: 'JPEG' | 'PNG' } | null> {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    const response = await fetch(proxyUrl, { headers: { Accept: 'application/json' } })
    if (!response.ok) return null

    const data = (await response.json()) as { base64?: string; type?: string }
    if (!data.base64) return null
    const bytes = Math.ceil((data.base64.length * 3) / 4)
    if (bytes > MAX_VCF_PHOTO_BYTES) return null

    return { base64: data.base64.replace(/\s+/g, ''), type: vcfPhotoType(data.type) }
  } catch {
    return null
  }
}

async function embedContactPhoto(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    const photo = await fetchImageAsBase64(url)
    if (!photo) continue
    return foldVcfLine(`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.base64}`)
  }
  if (urls[0]) {
    return foldVcfLine(`PHOTO;VALUE=URI:${escapeVcfValue(urls[0])}`)
  }
  return null
}

export async function buildContactVcf(contact: SaveContactCardData): Promise<string> {
  const { first, last } = splitFullName(contact.name)
  const lines: string[] = ['BEGIN:VCARD', '', 'VERSION:3.0', '']

  lines.push(`N:${escapeVcfValue(last)};${escapeVcfValue(first)};;;`, '')
  lines.push(`FN:${escapeVcfValue(contact.name)}`, '')

  if (contact.company?.trim()) {
    lines.push(`ORG:${escapeVcfValue(contact.company)}`, '')
  }

  if (contact.profession?.trim()) {
    lines.push(`TITLE:${escapeVcfValue(contact.profession)}`, '')
  } else {
    lines.push('TITLE:', '')
  }

  if (contact.phone?.trim()) {
    lines.push(`TEL;TYPE=CELL:${escapeVcfValue(contact.phone)}`, '')
  }

  if (contact.email?.trim()) {
    lines.push(`EMAIL:${escapeVcfValue(contact.email)}`, '')
  }

  if (contact.profileUrl?.trim()) {
    lines.push(`NOTE:Profile: ${escapeVcfValue(contact.profileUrl)}`, '')
  }

  if (contact.website?.trim()) {
    lines.push(`URL;TYPE=website:${escapeVcfValue(normalizeWebsite(contact.website))}`, '')
  }

  if (contact.profileUrl?.trim()) {
    lines.push(`URL;TYPE=vCard:${escapeVcfValue(contact.profileUrl)}`, '')
  }

  const photoLine = await embedContactPhoto(contactPhotoCandidateUrls(contact))
  if (photoLine) {
    lines.push(photoLine, '')
  }

  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export function vcfFilenameFromName(name?: string | null): string {
  const safe = (name?.trim() || 'contact')
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48)
  return `${safe || 'contact'}.vcf`
}

export function downloadContactVcf(vcfContent: string, filename = 'contact.vcf'): void {
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' })
  const nav = window.navigator as Navigator & { msSaveOrOpenBlob?: (file: Blob, fileName: string) => void }
  if (typeof nav.msSaveOrOpenBlob === 'function') {
    nav.msSaveOrOpenBlob(blob, filename)
    return
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2500)
}

export async function downloadProfileContactVcf(profileId: string, filename?: string): Promise<void> {
  const contact = await fetchSaveContactData(profileId)
  const vcf = await buildContactVcf(contact)
  downloadContactVcf(vcf, filename || vcfFilenameFromName(contact.name))
}
