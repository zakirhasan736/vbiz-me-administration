'use client'

import { baseUrl } from '@/redux/api/api'
import { store } from '@/redux/store'

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  const token = store.getState().user?.token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

type BackendEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
  error?: string
  code?: string
}

export class CardAgentError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly requestId?: string,
    readonly retryable?: boolean
  ) {
    super(message)
    this.name = 'CardAgentError'
  }
}

async function parseBackend<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as BackendEnvelope<T> & {
    requestId?: string
    data?: { requestId?: string; retryable?: boolean }
  }
  if (!res.ok) {
    const payload = json.data && typeof json.data === 'object' ? json.data : undefined
    const message =
      (typeof json.message === 'string' && json.message.trim()) ||
      (typeof json.error === 'string' && json.error.trim()) ||
      `AI request failed (${res.status})`
    throw new CardAgentError(
      message,
      res.status,
      typeof json.code === 'string' ? json.code : undefined,
      typeof payload?.requestId === 'string'
        ? payload.requestId
        : typeof json.requestId === 'string'
          ? json.requestId
          : res.headers.get('x-request-id') || undefined,
      Boolean(payload?.retryable)
    )
  }
  if (json.data !== undefined) return json.data as T
  return json as T
}

export function formatCardAgentError(error: unknown, fallback = 'AI request failed. Please try again.'): string {
  if (error instanceof CardAgentError) {
    const ref = error.requestId ? ` Reference: ${error.requestId}` : ''
    return `${error.message}${ref}`
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

/** Authenticated call to backend card-agent (OpenAI key stays on the API server). */
export async function cardAgentJson<T>(
  path: 'analyze' | 'suggest-tabs' | 'fill-section' | 'regenerate-section' | 'extract-sources' | 'generate-seo',
  body: unknown
): Promise<T> {
  const res = await fetch(`${baseUrl}/ai/card-agent/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  return parseBackend<T>(res)
}

export async function cardAgentForm<T>(
  path: 'analyze' | 'fill-section' | 'regenerate-section' | 'extract-sources' | 'jobs',
  form: FormData
): Promise<T> {
  const res = await fetch(`${baseUrl}/ai/card-agent/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: form,
  })
  return parseBackend<T>(res)
}

export async function cardAgentJobGet<T>(jobId: string): Promise<T> {
  const res = await fetch(`${baseUrl}/ai/card-agent/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  })
  return parseBackend<T>(res)
}

export async function cardAgentJobPost<T>(jobId: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}/ai/card-agent/jobs/${encodeURIComponent(jobId)}/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  return parseBackend<T>(res)
}
