import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData()
    const outbound = new FormData()
    for (const [key, value] of incoming.entries()) {
      if (typeof value === 'string') outbound.append(key, value)
    }

    const response = await fetchPublicCardResponse(`${getApiBaseUrl()}/save-guest-user`, {
      method: 'POST',
      body: outbound,
    })

    const payload = await response.text()
    return new NextResponse(payload, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save visitor details'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
