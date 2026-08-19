import { unwrapAssistantResponse } from '@/lib/assistantApi'
import { baseUrl } from '@/redux/api/api'

export type GeminiLiveToken = {
  token: string
  model: string
  expiresAt: string
  context?: string
}

export class LiveTokenError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'LiveTokenError'
  }
}

export function parseGeminiLiveToken(value: unknown): GeminiLiveToken {
  const payload = unwrapAssistantResponse<Record<string, unknown>>(value)
  const token = typeof payload?.token === 'string' ? payload.token.trim() : ''
  const model = typeof payload?.model === 'string' ? payload.model.trim() : ''
  const expiresAt = typeof payload?.expiresAt === 'string' ? payload.expiresAt : ''
  const context = typeof payload?.context === 'string' ? payload.context.trim() : ''
  if (!token || !model || !expiresAt || !Number.isFinite(Date.parse(expiresAt))) {
    throw new Error('The assistant returned an invalid live session token.')
  }
  return { token, model, expiresAt, ...(context ? { context } : {}) }
}

export async function requestGeminiLiveToken(profileId: string): Promise<GeminiLiveToken> {
  const id = profileId.trim()
  if (!id) throw new LiveTokenError('This card is missing its assistant profile id.', 400)

  const response = await fetch(`${baseUrl}/public/profiles/${encodeURIComponent(id)}/assistant/live-token`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null
  if (!response.ok) {
    const serverMessage = typeof body?.message === 'string' ? body.message.trim() : ''
    const fallback =
      response.status === 403 || response.status === 404
        ? 'AI Assistance is turned off for this card.'
        : response.status === 409
          ? serverMessage || 'This card cannot start a live session yet. Try again after the latest API update.'
          : response.status === 429
            ? 'The assistant is busy right now. Please wait a moment and try again.'
            : response.status === 503
              ? serverMessage || 'The assistant is temporarily unavailable. Please try again shortly.'
              : serverMessage || `Could not start the assistant (${response.status}).`
    throw new LiveTokenError(fallback, response.status)
  }
  return parseGeminiLiveToken(body)
}
