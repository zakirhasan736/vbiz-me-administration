import type { SaveContactCardData, SaveContactResponse } from '@/interfaces/api/saveContact'
import { serializeContactVcf, type VcfPhoto } from '@/profile-app/lib/contactVcf'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_VCF_PHOTO_BYTES = 1_200_000

const EXACT_HOSTS = new Set([
  'app.vbizme.com',
  'www.app.vbizme.com',
  'vbiz.me',
  'www.vbiz.me',
  'vbizme.com',
  'www.vbizme.com',
  'localhost',
  '127.0.0.1',
])

function hostFromEnv(raw?: string | null): string | null {
  const value = raw?.trim()
  if (!value) return null
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase()
  } catch {
    return null
  }
}

function isAllowedImageHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase()
  if (!host) return false
  if (EXACT_HOSTS.has(host)) return true
  if (host.endsWith('.vbizme.com') || host.endsWith('.vbiz.me')) return true
  const apiHost = hostFromEnv(process.env.NEXT_PUBLIC_API_URL)
  const appHost = hostFromEnv(process.env.NEXT_PUBLIC_APP_URL)
  if (apiHost && host === apiHost) return true
  if (appHost && host === appHost) return true
  return host.endsWith('.amazonaws.com') || host.includes('.s3.') || host.endsWith('.cloudfront.net')
}

function sniffImageType(bytes: Uint8Array): 'JPEG' | 'PNG' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'JPEG'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'PNG'
  }
  return null
}

function vcfFilenameFromName(name?: string | null): string {
  const safe = (name?.trim() || 'contact')
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48)
  const base = safe || 'contact'
  return base.toLowerCase().endsWith('.vcf') ? base : `${base}.vcf`
}

function looksLikeAppleMobile(ua: string): boolean {
  return /iPhone|iPad|iPod/i.test(ua)
}

async function fetchPhoto(url: string): Promise<VcfPhoto | null> {
  try {
    const parsed = new URL(url)
    if (!['https:', 'http:'].includes(parsed.protocol)) return null
    if (!isAllowedImageHost(parsed.hostname)) return null
    const response = await fetch(parsed.toString(), { cache: 'no-store' })
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length > MAX_VCF_PHOTO_BYTES) return null
    const type = sniffImageType(buffer)
    if (!type) return null
    return { base64: buffer.toString('base64'), type }
  } catch {
    return null
  }
}

async function loadContact(profileId: string, visitorId?: string): Promise<SaveContactCardData> {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')
  const query = visitorId ? `?visitor_id=${encodeURIComponent(visitorId)}` : ''
  const response = await fetch(`${apiBase}/public/save-contact/${encodeURIComponent(profileId)}${query}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to load contact details')
  }
  const payload = (await response.json()) as SaveContactResponse
  const contact = payload.data?.action_buttons?.save_contact?.data
  if (!contact?.name) throw new Error('Contact details are unavailable')
  return contact
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const profileId = id?.trim()
  if (!profileId) {
    return NextResponse.json({ error: 'Missing profile id' }, { status: 400 })
  }

  try {
    const visitorId = request.nextUrl.searchParams.get('visitor_id')?.trim() || undefined
    const requestedName = request.nextUrl.searchParams.get('filename')?.trim()
    const contact = await loadContact(profileId, visitorId)

    let photo: VcfPhoto | null = null
    for (const raw of [contact.imageUrl, ...(contact.imageUrls || [])]) {
      const url = String(raw || '').trim()
      if (!url || /\.(mp4|webm|mov)(\?|#|$)/i.test(url)) continue
      const absolute = url.startsWith('//') ? `https:${url}` : url
      if (!/^https?:\/\//i.test(absolute)) continue
      photo = await fetchPhoto(absolute)
      if (photo) break
    }

    const vcf = serializeContactVcf(contact, photo)
    const filename = vcfFilenameFromName(requestedName || contact.name)
    const ua = request.headers.get('user-agent') || ''
    const dispositionType = looksLikeAppleMobile(ua) ? 'inline' : 'attachment'

    return new NextResponse(vcf, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `${dispositionType}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build contact file'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
