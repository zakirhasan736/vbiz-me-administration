import { getServerApiOrigin } from '@/lib/api/serverApi'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Same-origin proxy for owner Web Push subscribe.
 * Avoids cross-origin failures when the browser has Allowed notifications but
 * the backoffice cannot reach the API host directly (CORS / mixed network).
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!auth?.trim()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    profileId?: string
    endpoint?: string
    keys?: { p256dh?: string; auth?: string }
    browser?: string
    platform?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : ''
  if (!profileId || !body.endpoint?.trim() || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ success: false, message: 'profileId, endpoint, and keys are required' }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${getServerApiOrigin()}/profiles/${encodeURIComponent(profileId)}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        endpoint: body.endpoint,
        keys: body.keys,
        browser: body.browser,
        platform: body.platform,
        audience: 'owner',
      }),
      cache: 'no-store',
    })
    const payload = await upstream.text()
    return new NextResponse(payload, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save owner push subscription'
    return NextResponse.json({ success: false, message }, { status: 502 })
  }
}
