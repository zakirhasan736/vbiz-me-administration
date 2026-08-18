const authApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

let refreshPromise: Promise<string | null> | null = null

export function refreshSessionAccessToken(token?: string | null): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(`${authApiBaseUrl}/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
    .then(async (response) => {
      if (!response.ok) return null

      try {
        const body = (await response.json()) as {
          success?: boolean
          data?: { accessToken?: string }
        }
        return body.success && body.data?.accessToken ? body.data.accessToken : null
      } catch {
        return null
      }
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}
