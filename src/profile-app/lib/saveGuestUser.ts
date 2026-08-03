import type { SavedGuestUser } from '@/interfaces/api/saveGuestUser'
import { baseUrl } from '@/redux/api/publicApi'

export class SaveGuestUserError extends Error {
  status?: number
  /** True when the failure is a duplicate email (contact already saved). */
  isDuplicate: boolean

  constructor(message: string, status?: number, isDuplicate = false) {
    super(message)
    this.name = 'SaveGuestUserError'
    this.status = status
    this.isDuplicate = isDuplicate
  }
}

/** Detects the backend "email already saved" failure (unique constraint / 1062). */
function isDuplicateEmailMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('duplicate entry') ||
    normalized.includes('guest_user_data_email_unique') ||
    normalized.includes('1062') ||
    (normalized.includes('email') && normalized.includes('already'))
  )
}

export type SaveGuestUserInput = {
  firstName: string
  lastName: string
  email: string
  profileId: string
}

export async function saveGuestUser(input: SaveGuestUserInput): Promise<SavedGuestUser> {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const email = input.email.trim()
  const profileId = input.profileId.trim()

  if (!firstName) throw new SaveGuestUserError('First name is required')
  if (!lastName) throw new SaveGuestUserError('Last name is required')
  if (!email) throw new SaveGuestUserError('Email is required')
  if (!profileId) throw new SaveGuestUserError('Profile ID is required')

  const body = new FormData()
  body.append('first_name', firstName)
  body.append('last_name', lastName)
  body.append('email', email)
  body.append('profile_id', profileId)

  const response = await fetch(`${baseUrl}/save-guest-user`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body,
  })

  if (!response.ok) {
    let rawMessage = 'Failed to save visitor details'
    try {
      const payload = (await response.json()) as { message?: string; error?: string }
      if (typeof payload.message === 'string') rawMessage = payload.message
      else if (typeof payload.error === 'string') rawMessage = payload.error
    } catch {
      /* ignore parse errors */
    }

    if (isDuplicateEmailMessage(rawMessage)) {
      throw new SaveGuestUserError('This email has already saved this contact.', response.status, true)
    }
    throw new SaveGuestUserError(rawMessage, response.status)
  }

  return (await response.json()) as SavedGuestUser
}
