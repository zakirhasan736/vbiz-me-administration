import type { CanvaConnectionStatus, CanvaExportFormat, CanvaLibraryItem } from '@/lib/canva/types'
import { baseUrl } from '@/redux/api/api'
import { store } from '@/redux/store'

type Envelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

function authHeaders(): HeadersInit {
  const token = store.getState().user.token
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function canvaJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/integrations/canva${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  })

  const body = (await response.json().catch(() => null)) as Envelope<T> | null
  if (!response.ok || !body?.success) {
    throw new Error(body?.message || `Canva request failed (${response.status})`)
  }
  return body.data as T
}

export async function fetchCanvaStatus(): Promise<CanvaConnectionStatus & { configured?: boolean }> {
  return canvaJson('/status')
}

export async function fetchCanvaAuthorizeUrl(returnTo?: string): Promise<string> {
  const qs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
  const data = await canvaJson<{ url: string }>(`/authorize-url${qs}`)
  if (!data?.url) throw new Error('Missing Canva authorize URL')
  return data.url
}

export async function disconnectCanvaApi(): Promise<void> {
  await canvaJson('/', { method: 'DELETE' })
}

export async function listCanvaDesignsApi(options?: {
  query?: string
  continuation?: string
}): Promise<{ items: CanvaLibraryItem[]; continuation?: string }> {
  const params = new URLSearchParams()
  if (options?.query?.trim()) params.set('query', options.query.trim())
  if (options?.continuation) params.set('continuation', options.continuation)
  const qs = params.toString() ? `?${params}` : ''
  return canvaJson(`/designs${qs}`)
}

export async function importCanvaDesignApi(input: {
  designId: string
  designName?: string
  format?: CanvaExportFormat
}): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/integrations/canva/import`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message || `Canva import failed (${response.status})`)
  }

  const blob = await response.blob()
  const filename = response.headers.get('X-Canva-Filename') || `canva-design.${input.format === 'mp4' ? 'mp4' : 'png'}`
  return { blob, filename }
}
