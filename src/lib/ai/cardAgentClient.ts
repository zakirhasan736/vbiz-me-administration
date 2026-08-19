'use client'

import { baseUrl } from '@/redux/api/api'
import { store } from '@/redux/store'

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  const token = store.getState().user?.token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

function newClientRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

type BackendEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
  error?: string
  code?: string
  requestId?: string
}

export class CardAgentError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly requestId?: string,
    readonly retryable?: boolean,
    readonly stage?: string
  ) {
    super(message)
    this.name = 'CardAgentError'
  }
}

const PRODUCT_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "I couldn't reach the vBiz Me AI service. Your existing card is safe. Try again.",
  WEBSITE_FETCH_FAILED:
    "I couldn't read that website. Your existing card is safe. Try the URL again, paste the information, or upload a document.",
  DOCUMENT_READ_FAILED: "I couldn't finish reading that document. Try uploading it again or use another file.",
  OCR_FAILED: "I couldn't finish reading that document. Try uploading it again or use another file.",
  AI_PLANNING_FAILED:
    "I read your source, but the AI couldn't finish planning the update. Your current card is unchanged. Try again.",
  TIMEOUT: 'That source took too long to analyze. Your card is unchanged. Try again or use a smaller source.',
  SOURCE_ANALYSIS_FAILED: "We couldn't finish analyzing that source. Your existing card was not overwritten.",
  INVALID_URL: 'That website address is not valid. Check the URL and try again.',
  VALIDATION_FAILED: 'I need a website, pasted text, or a document before I can analyze sources.',
  PROFILE_REQUIRED: 'I need your current card loaded before I can plan an update.',
  RATE_LIMITED: 'The AI service is busy. Wait a moment and try again. Your existing card is unchanged.',
}

function isRawNetworkMessage(message: string) {
  return /failed to fetch|networkerror when attempting to fetch|load failed|network request failed/i.test(message)
}

export function classifyNetworkError(error: unknown, requestId?: string): CardAgentError {
  const raw = error instanceof Error ? error.message : String(error || 'Network error')
  const name = error instanceof Error ? error.name : ''
  if (name === 'AbortError' || /timeout|aborted/i.test(raw)) {
    return new CardAgentError(PRODUCT_MESSAGES.TIMEOUT, 0, 'TIMEOUT', requestId, true, 'source_fetch')
  }
  return new CardAgentError(PRODUCT_MESSAGES.NETWORK_ERROR, 0, 'NETWORK_ERROR', requestId, true, 'source_fetch')
}

async function parseBackend<T>(res: Response, fallbackRequestId?: string): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as BackendEnvelope<T> & {
    requestId?: string
    data?: { requestId?: string; retryable?: boolean; stage?: string }
  }
  const headerId = res.headers.get('x-vbiz-request-id') || res.headers.get('x-request-id') || undefined
  const payload = json.data && typeof json.data === 'object' ? json.data : undefined
  const requestId =
    (typeof payload?.requestId === 'string' && payload.requestId) ||
    (typeof json.requestId === 'string' && json.requestId) ||
    headerId ||
    fallbackRequestId
  if (!res.ok) {
    const code = typeof json.code === 'string' ? json.code : undefined
    const serverMessage =
      (typeof json.message === 'string' && json.message.trim()) ||
      (typeof json.error === 'string' && json.error.trim()) ||
      ''
    const message =
      (code && PRODUCT_MESSAGES[code]) ||
      (isRawNetworkMessage(serverMessage) ? PRODUCT_MESSAGES.NETWORK_ERROR : serverMessage) ||
      `AI request failed (${res.status})`
    throw new CardAgentError(
      message,
      res.status,
      code,
      requestId,
      Boolean(payload?.retryable) || res.status >= 500 || res.status === 429,
      typeof payload?.stage === 'string' ? payload.stage : undefined
    )
  }
  if (json.data !== undefined) return json.data as T
  return json as T
}

export function formatCardAgentError(error: unknown, fallback = 'AI request failed. Please try again.'): string {
  if (error instanceof CardAgentError) {
    const mapped = error.code && PRODUCT_MESSAGES[error.code] ? PRODUCT_MESSAGES[error.code] : error.message
    const safe = isRawNetworkMessage(mapped) ? PRODUCT_MESSAGES.NETWORK_ERROR : mapped
    const ref = error.requestId ? ` Reference: ${error.requestId}` : ''
    return `${safe}${ref}`
  }
  if (error instanceof Error && isRawNetworkMessage(error.message)) {
    return PRODUCT_MESSAGES.NETWORK_ERROR
  }
  if (error instanceof Error && error.message.trim() && !isRawNetworkMessage(error.message)) {
    return error.message
  }
  return fallback
}

async function cardAgentFetch(url: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers)
  const requestId = headers.get('x-vbiz-request-id') || newClientRequestId()
  headers.set('x-vbiz-request-id', requestId)
  try {
    return await fetch(url, { ...init, headers })
  } catch (error) {
    throw classifyNetworkError(error, requestId)
  }
}

/** Authenticated call to backend card-agent (OpenAI key stays on the API server). */
export async function cardAgentJson<T>(
  path: 'analyze' | 'suggest-tabs' | 'fill-section' | 'regenerate-section' | 'extract-sources' | 'generate-seo',
  body: unknown
): Promise<T> {
  const res = await cardAgentFetch(`${baseUrl}/ai/card-agent/${path}`, {
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
  const res = await cardAgentFetch(`${baseUrl}/ai/card-agent/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: form,
  })
  return parseBackend<T>(res)
}

export async function cardAgentJobGet<T>(jobId: string): Promise<T> {
  const res = await cardAgentFetch(`${baseUrl}/ai/card-agent/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  })
  return parseBackend<T>(res)
}

export async function cardAgentJobPost<T>(jobId: string, path: string, body: unknown): Promise<T> {
  const res = await cardAgentFetch(`${baseUrl}/ai/card-agent/jobs/${encodeURIComponent(jobId)}/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  return parseBackend<T>(res)
}
