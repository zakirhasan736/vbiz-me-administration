const authApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

export type RefreshSessionResult = {
  accessToken: string | null
  /** True when the refresh cookie/session is gone or rejected (must sign in again). */
  hardExpired: boolean
  status: number | null
}

let refreshPromise: Promise<RefreshSessionResult> | null = null

export function resetRefreshSessionLock(): void {
  refreshPromise = null
}

async function parseRefreshResponse(response: Response): Promise<RefreshSessionResult> {
  if (response.status === 401 || response.status === 403 || response.status === 419) {
    return { accessToken: null, hardExpired: true, status: response.status }
  }
  if (!response.ok) {
    return { accessToken: null, hardExpired: false, status: response.status }
  }

  try {
    const body = (await response.json()) as {
      success?: boolean
      data?: { accessToken?: string; refreshToken?: string }
    }
    const accessToken = body.success && body.data?.accessToken ? body.data.accessToken : null
    return {
      accessToken,
      hardExpired: !accessToken,
      status: response.status,
    }
  } catch {
    return { accessToken: null, hardExpired: true, status: response.status }
  }
}

/**
 * Rotates the access token using the httpOnly refresh cookie.
 * Deduplicates concurrent callers so admin / corporate / single dashboards share one refresh.
 */
export function refreshSessionAccessToken(token?: string | null): Promise<string | null> {
  return refreshSession(token).then((result) => result.accessToken)
}

export function refreshSession(token?: string | null): Promise<RefreshSessionResult> {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(`${authApiBaseUrl}/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
    .then(parseRefreshResponse)
    .catch(() => ({ accessToken: null, hardExpired: false, status: null }) satisfies RefreshSessionResult)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}
