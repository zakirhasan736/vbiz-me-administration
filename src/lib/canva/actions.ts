'use server'

import { buildAuthorizationUrl, revokeToken } from '@/lib/canva/client'
import { createOAuthState, createPkcePair } from '@/lib/canva/pkce'
import { setCanvaOAuthSession } from '@/lib/canva/session'
import {
  deleteCanvaTokens,
  getCanvaConnectionStatus,
  getCanvaTokens,
  getValidCanvaAccessToken,
} from '@/lib/canva/token-store'
import type { CanvaConnectionStatus } from '@/lib/canva/types'
import { sanitizeReturnTo } from '@/lib/canva/utils'
import { redirect } from 'next/navigation'

function requireUserId(userId: string) {
  const trimmed = userId.trim()
  if (!trimmed) {
    throw new Error('userId is required')
  }
  return trimmed
}

export async function getCanvaConnectionStatusAction(userId: string): Promise<CanvaConnectionStatus> {
  return getCanvaConnectionStatus(requireUserId(userId))
}

export async function disconnectCanvaAction(userId: string): Promise<{ connected: false }> {
  const trimmedUserId = requireUserId(userId)
  const tokens = await getCanvaTokens(trimmedUserId)

  if (tokens) {
    try {
      await revokeToken(tokens.refreshToken)
    } catch {
      // Token may already be invalid; still clear local storage.
    }
  }

  await deleteCanvaTokens(trimmedUserId)
  return { connected: false }
}

export async function getCanvaAccessTokenAction(userId: string): Promise<{ accessToken: string }> {
  const accessToken = await getValidCanvaAccessToken(requireUserId(userId))

  if (!accessToken) {
    throw new Error('Canva is not connected')
  }

  return { accessToken }
}

export async function startCanvaAuthAction(userId: string, returnTo?: string) {
  const trimmedUserId = requireUserId(userId)
  const safeReturnTo = sanitizeReturnTo(returnTo, '/')

  const { codeVerifier, codeChallenge } = createPkcePair()
  const state = createOAuthState()

  await setCanvaOAuthSession({
    state,
    codeVerifier,
    userId: trimmedUserId,
    returnTo: safeReturnTo,
  })

  const authorizationUrl = buildAuthorizationUrl({ codeChallenge, state })
  redirect(authorizationUrl)
}
