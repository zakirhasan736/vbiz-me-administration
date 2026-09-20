import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function joinedPath(parts: string[] | undefined): string {
  return (parts || [])
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/')
}

function isAllowedPushPath(method: string, path: string): boolean {
  if (method === 'GET') {
    return path === 'vapid-public-key' || /^subscription-status\/[^/]+$/.test(path)
  }
  if (method === 'POST') {
    return path === 'subscribe' || path === 'preferences' || path === 'unsubscribe' || path === 'test'
  }
  return false
}

async function proxyPush(request: NextRequest, path: string): Promise<NextResponse> {
  if (!isAllowedPushPath(request.method, path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const search = request.nextUrl.search || ''
  const init: RequestInit = {
    method: request.method,
  }
  if (request.method === 'POST') {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = await request.text()
  }

  const response = await fetchPublicCardResponse(`${getApiBaseUrl()}/push/${path}${search}`, init)
  const payload = await response.text()
  return new NextResponse(payload, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
  })
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  try {
    return await proxyPush(request, joinedPath(path))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load push status'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  try {
    return await proxyPush(request, joinedPath(path))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save push subscription'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
