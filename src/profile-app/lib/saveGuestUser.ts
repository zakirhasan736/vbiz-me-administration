import type { SavedGuestUser } from '@/interfaces/api/saveGuestUser'
import { markContactSaved } from '@/profile-app/lib/contactSaveState'
import { getOrCreateGuestId } from '@/profile-app/lib/guestId'
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
    normalized.includes('already_saved') ||
    (normalized.includes('email') && normalized.includes('already'))
  )
}

function collectClientMeta(cardSlug?: string): Record<string, string | null> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { cardSlug: cardSlug?.trim() || null }
  }

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return {
    guestId: getOrCreateGuestId() || null,
    userAgent: nav.userAgent || null,
    language: nav.language || null,
    platform: nav.userAgentData?.platform || nav.platform || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    screen:
      typeof window.screen?.width === 'number' && typeof window.screen?.height === 'number'
        ? `${window.screen.width}x${window.screen.height}`
        : null,
    referrer: document.referrer || null,
    cardSlug: cardSlug?.trim() || null,
  }
}

export type SaveGuestUserInput = {
  fullName: string
  phone: string
  email: string
  profileId: string
  cardSlug?: string
}

export async function saveGuestUser(input: SaveGuestUserInput): Promise<SavedGuestUser> {
  const fullName = input.fullName.trim()
  const phone = input.phone.trim()
  const email = input.email.trim()
  const profileId = input.profileId.trim()

  if (!fullName) throw new SaveGuestUserError('Full name is required')
  if (!phone) throw new SaveGuestUserError('Phone number is required')
  if (!email) throw new SaveGuestUserError('Email is required')
  if (!profileId) throw new SaveGuestUserError('Profile ID is required')

  const body = new FormData()
  body.append('full_name', fullName)
  body.append('phone', phone)
  body.append('email', email)
  body.append('profile_id', profileId)
  body.append('meta', JSON.stringify(collectClientMeta(input.cardSlug)))

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
      markContactSaved(profileId, { email, fullName })
      throw new SaveGuestUserError('This email has already saved this contact.', response.status, true)
    }
    throw new SaveGuestUserError(rawMessage, response.status)
  }

  const payload = (await response.json()) as { data?: SavedGuestUser } & SavedGuestUser
  const saved = (payload.data ?? payload) as SavedGuestUser
  markContactSaved(profileId, { email, fullName })
  return saved
}
