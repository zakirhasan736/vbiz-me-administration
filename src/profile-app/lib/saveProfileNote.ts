import type { SavedNote } from '@/interfaces/api/saveNote'
import { baseUrl } from '@/redux/api/publicApi'

export type SaveProfileNoteOptions = {
  authorName?: string
  visitorId?: string
}

type ApiEnvelope<T> = {
  data?: T
  message?: string
  error?: string
}

export class SaveNoteError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'SaveNoteError'
    this.status = status
  }
}

export async function saveProfileNote(
  profileId: string,
  content: string,
  options: SaveProfileNoteOptions = {}
): Promise<SavedNote> {
  const trimmedId = profileId.trim()
  const trimmedContent = content.trim()

  if (!trimmedId) {
    throw new SaveNoteError('Profile ID is required')
  }
  if (!trimmedContent) {
    throw new SaveNoteError('Note content is required')
  }

  const params = new URLSearchParams({
    profile_id: trimmedId,
    content: trimmedContent,
  })
  if (options.authorName?.trim()) params.set('author_name', options.authorName.trim())
  if (options.visitorId?.trim()) params.set('visitor_id', options.visitorId.trim())

  const response = await fetch(`${baseUrl}/save-note?${params.toString()}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    let message = 'Failed to save note'
    try {
      const body = (await response.json()) as { message?: string; error?: string }
      if (typeof body.message === 'string') message = body.message
      else if (typeof body.error === 'string') message = body.error
    } catch {
      /* ignore parse errors */
    }
    throw new SaveNoteError(message, response.status)
  }

  const payload = (await response.json()) as ApiEnvelope<SavedNote> | SavedNote
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
    return payload.data
  }
  return payload as SavedNote
}

export class LoadNotesError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'LoadNotesError'
    this.status = status
  }
}

export async function fetchProfileNotes(profileId: string, visitorId: string): Promise<SavedNote[]> {
  const trimmedId = profileId.trim()
  const trimmedVisitorId = visitorId.trim()
  if (!trimmedId) throw new LoadNotesError('Profile ID is required')
  if (!trimmedVisitorId) throw new LoadNotesError('Visitor ID is required')

  const params = new URLSearchParams({ profile_id: trimmedId, visitor_id: trimmedVisitorId })
  const response = await fetch(`${baseUrl}/notes?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!response.ok) {
    let message = 'Failed to load notes'
    try {
      const body = (await response.json()) as ApiEnvelope<unknown>
      if (typeof body.message === 'string') message = body.message
      else if (typeof body.error === 'string') message = body.error
    } catch {
      /* ignore parse errors */
    }
    throw new LoadNotesError(message, response.status)
  }

  const payload = (await response.json()) as ApiEnvelope<SavedNote[]> | SavedNote[]
  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data)) {
    return payload.data
  }
  return Array.isArray(payload) ? payload : []
}

function createVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

export function getProfileVisitorId(profileId: string): string | null {
  const trimmedId = profileId.trim()
  if (typeof window === 'undefined' || !trimmedId) return null

  const storageKey = `vbiz_profile_visitor_${encodeURIComponent(trimmedId)}`
  try {
    const existing = window.localStorage.getItem(storageKey)?.trim()
    if (existing) return existing
    const created = createVisitorId()
    window.localStorage.setItem(storageKey, created)
    return created
  } catch {
    return createVisitorId()
  }
}
