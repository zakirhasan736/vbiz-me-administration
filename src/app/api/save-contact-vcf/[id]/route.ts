import { isAllowedContactImageHost, jpegPhotoFromImageBytes } from '@/app/api/save-contact-vcf/loadVcfPhoto'
import type { SaveContactCardData, SaveContactResponse } from '@/interfaces/api/saveContact'
import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'
import { visitorForwardHeaders, visitorMetaFromRequest } from '@/lib/visitorRequestHeaders'
import { contactPhotoCandidateUrls, serializeContactVcf, type VcfPhoto } from '@/profile-app/lib/contactVcf'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

function clip(value: string | null, max = 200): string {
  return (value || '').trim().slice(0, max)
}

async function fetchPhoto(url: string): Promise<VcfPhoto | null> {
  try {
    const parsed = new URL(url)
    if (!['https:', 'http:'].includes(parsed.protocol)) return null
    if (!isAllowedContactImageHost(parsed.hostname)) return null
    const response = await fetch(parsed.toString(), {
      cache: 'no-store',
      redirect: 'follow',
      headers: { Accept: 'image/avif,image/webp,image/apng,image/png,image/jpeg,image/*,*/*;q=0.8' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    return jpegPhotoFromImageBytes(buffer)
  } catch {
    return null
  }
}

async function loadContact(profileId: string, visitorId?: string): Promise<SaveContactCardData> {
  const query = visitorId ? `?visitor_id=${encodeURIComponent(visitorId)}` : ''
  const response = await fetchPublicCardResponse(
    `${getApiBaseUrl()}/save-contact/${encodeURIComponent(profileId)}${query}`
  )
  if (!response.ok) {
    throw new Error('Failed to load contact details')
  }
  const payload = (await response.json()) as SaveContactResponse
  const contact = payload.data?.action_buttons?.save_contact?.data
  if (!contact?.name) throw new Error('Contact details are unavailable')
  return contact
}

/**
 * Persist the visitor as a CRM / back-office lead while serving the VCF.
 * Must not fail the download if lead save errors.
 */
async function recordGuestLead(
  request: NextRequest,
  profileId: string,
  params: { visitorId?: string; fullName: string; phone: string; email: string; cardSlug: string }
): Promise<void> {
  try {
    const meta = visitorMetaFromRequest(request, {
      guestId: params.visitorId || undefined,
      cardSlug: params.cardSlug || undefined,
      source: 'save_contact',
    })
    const response = await fetchPublicCardResponse(`${getApiBaseUrl()}/save-guest-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...visitorForwardHeaders(request),
      },
      body: JSON.stringify({
        profile_id: profileId,
        full_name: params.fullName,
        phone: params.phone,
        email: params.email,
        meta,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      await response.text().catch(() => '')
    }
  } catch {
    /* lead save must not block the contact file */
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const profileId = id?.trim()
  if (!profileId) {
    return NextResponse.json({ error: 'Missing profile id' }, { status: 400 })
  }

  try {
    const search = request.nextUrl.searchParams
    const visitorId = clip(search.get('visitor_id'), 128) || undefined
    const requestedName = clip(search.get('filename'), 80)
    const fullName = clip(search.get('full_name'))
    const phone = clip(search.get('phone'), 40)
    const email = clip(search.get('email'))
    const cardSlug = clip(search.get('card_slug'), 120)

    const [contact] = await Promise.all([
      loadContact(profileId, visitorId),
      recordGuestLead(request, profileId, { visitorId, fullName, phone, email, cardSlug }),
    ])

    let photo: VcfPhoto | null = null
    for (const url of contactPhotoCandidateUrls(contact)) {
      photo = await fetchPhoto(url)
      if (photo) break
    }

    const ua = request.headers.get('user-agent') || ''
    const vcf = serializeContactVcf(contact, photo, {
      platform: /Android/i.test(ua) ? 'android' : 'apple',
    })
    const filename = vcfFilenameFromName(requestedName || contact.name)
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
