import type { SavedNote } from '@/interfaces/api/saveNote'
import { baseUrl } from '@/redux/api/publicApi'

export class SaveNoteError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'SaveNoteError'
    this.status = status
  }
}

export async function saveProfileNote(profileId: string, content: string): Promise<SavedNote> {
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

  return (await response.json()) as SavedNote
}
