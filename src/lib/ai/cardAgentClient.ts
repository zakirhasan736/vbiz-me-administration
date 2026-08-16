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
}

async function parseBackend<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as BackendEnvelope<T> & Record<string, unknown>
  if (!res.ok) {
    const message =
      (typeof json.message === 'string' && json.message) ||
      (typeof json.error === 'string' && json.error) ||
      `AI request failed (${res.status})`
    throw new Error(message)
  }
  if (json.data !== undefined) return json.data as T
  return json as T
}

/** Authenticated call to backend card-agent (OpenAI key stays on the API server). */
export async function cardAgentJson<T>(
  path: 'analyze' | 'suggest-tabs' | 'fill-section' | 'regenerate-section' | 'extract-sources',
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
