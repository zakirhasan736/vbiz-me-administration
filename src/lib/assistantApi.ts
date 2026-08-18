import { baseUrl } from '@/redux/api/api'
import { store } from '@/redux/store'

export type AssistantKnowledgeItem = {
  id: string
  name: string
  summary?: string
  createdAt?: string
}

export type AssistantConfig = {
  enabled: boolean
  businessBrief?: string
  lastTrainedAt?: string
  lastTrainedSummary?: string
}

type JsonRecord = Record<string, unknown>

function record(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : null
}

export function unwrapAssistantResponse<T>(value: unknown): T {
  let current = value
  for (let depth = 0; depth < 3; depth++) {
    const object = record(current)
    if (!object) break
    if (object.data !== undefined) {
      current = object.data
      continue
    }
    if (object.result !== undefined) {
      current = object.result
      continue
    }
    break
  }
  return current as T
}

function messageFromBody(body: unknown, status: number): string {
  const object = record(body)
  const message = object?.message ?? object?.error
  return typeof message === 'string' && message.trim() ? message : `Assistant request failed (${status})`
}

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  const token = store.getState().user?.token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('Accept', 'application/json')
  return headers
}

async function assistantRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: authHeaders(init.headers),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(messageFromBody(body, response.status))
  return unwrapAssistantResponse<T>(body)
}

export function assistantProfilePath(profileId: string, suffix: string): string {
  return `/profiles/${encodeURIComponent(profileId)}/assistant/${suffix}`
}

export function getAssistantConfig(profileId: string): Promise<AssistantConfig> {
  return assistantRequest(assistantProfilePath(profileId, 'config'))
}

export function patchAssistantConfig(profileId: string, patch: Partial<AssistantConfig>): Promise<AssistantConfig> {
  return assistantRequest(assistantProfilePath(profileId, 'config'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export async function getAssistantKnowledge(profileId: string): Promise<AssistantKnowledgeItem[]> {
  const value = await assistantRequest<unknown>(assistantProfilePath(profileId, 'knowledge'))
  const object = record(value)
  const list = Array.isArray(value) ? value : Array.isArray(object?.items) ? object.items : []
  const items: AssistantKnowledgeItem[] = []
  for (const item of list) {
    const row = record(item)
    if (!row) continue
    const id = String(row.id ?? row.knowledgeId ?? row.knowledge_id ?? '').trim()
    if (!id) continue
    items.push({
      id,
      name: String(row.name ?? row.label ?? row.fileName ?? row.file_name ?? row.title ?? 'Knowledge source'),
      summary: typeof row.summary === 'string' ? row.summary : undefined,
      createdAt:
        typeof (row.createdAt ?? row.created_at) === 'string' ? String(row.createdAt ?? row.created_at) : undefined,
    })
  }
  return items
}

export function extractAssistantKnowledge(profileId: string, businessText: string, files: File[]): Promise<unknown> {
  const form = buildAssistantTrainingForm(businessText, files)
  return assistantRequest(assistantProfilePath(profileId, 'knowledge/extract'), { method: 'POST', body: form })
}

export function deleteAssistantKnowledge(profileId: string, knowledgeId: string): Promise<unknown> {
  return assistantRequest(assistantProfilePath(profileId, `knowledge/${encodeURIComponent(knowledgeId)}`), {
    method: 'DELETE',
  })
}

export function buildAssistantTrainingForm(businessText: string, files: File[]): FormData {
  const form = new FormData()
  if (businessText.trim()) form.set('businessText', businessText.trim())
  files.forEach((file) => form.append('files', file))
  return form
}

export function buildAssistantSectionForm(section: string, businessText: string, files: File[]): FormData {
  const form = new FormData()
  form.set('section', section)
  if (businessText.trim()) {
    form.set('businessText', businessText.trim())
    form.set('text', businessText.trim())
  }
  files.forEach((file) => form.append('files', file))
  return form
}

export function scopeAssistantSectionPayload<T extends Record<string, unknown>>(section: string, payload: T): T {
  return { [section]: payload[section] } as T
}

export async function fillAssistantSection<T>(
  profileId: string,
  section: string,
  businessText: string,
  files: File[]
): Promise<T> {
  const form = buildAssistantSectionForm(section, businessText, files)
  return assistantRequest<T>(assistantProfilePath(profileId, 'fill-section'), { method: 'POST', body: form })
}
