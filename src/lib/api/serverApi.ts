const ONE_HOUR_SECONDS = 60 * 60

/** Public card API base (`/api/v1/public`). */
export function getApiBaseUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_PUBLIC_API_URL
  const fromPrivate = process.env.NEXT_PUBLIC_API_URL
  const base =
    fromPublic || (fromPrivate ? `${fromPrivate.replace(/\/$/, '')}/public` : 'http://localhost:5000/api/v1/public')
  return base.replace(/\/$/, '')
}

export const SERVER_FETCH_REVALIDATE_SECONDS = ONE_HOUR_SECONDS
