import { getCanvaConfig } from '@/lib/canva/config'
import type { CanvaTokenResponse } from '@/lib/canva/types'

function getBasicAuthHeader() {
  const { clientId, clientSecret } = getCanvaConfig()
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return `Basic ${credentials}`
}

async function requestToken(body: URLSearchParams): Promise<CanvaTokenResponse> {
  const { apiBaseUrl } = getCanvaConfig()

  const response = await fetch(`${apiBaseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: getBasicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const data = (await response.json()) as CanvaTokenResponse & { code?: string; message?: string }

  if (!response.ok) {
    throw new Error(data.message || data.code || 'Failed to exchange Canva token')
  }

  return data
}

export async function exchangeAuthorizationCode({ code, codeVerifier }: { code: string; codeVerifier: string }) {
  const { redirectUri } = getCanvaConfig()
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  })

  return requestToken(body)
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  return requestToken(body)
}

export async function revokeToken(token: string) {
  const { apiBaseUrl } = getCanvaConfig()

  const response = await fetch(`${apiBaseUrl}/oauth/revoke`, {
    method: 'POST',
    headers: {
      Authorization: getBasicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ token }),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(data?.message || 'Failed to revoke Canva token')
  }
}

export function buildAuthorizationUrl({ codeChallenge, state }: { codeChallenge: string; state: string }) {
  const { authBaseUrl, clientId, redirectUri, scopes } = getCanvaConfig()

  const params = new URLSearchParams({
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: scopes,
    response_type: 'code',
    client_id: clientId,
    state,
    redirect_uri: redirectUri,
  })

  return `${authBaseUrl}?${params.toString()}`
}
