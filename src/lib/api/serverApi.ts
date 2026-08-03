const ONE_HOUR_SECONDS = 60 * 60

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'https://app.vbizme.com/api'
  return base.replace(/\/$/, '')
}

export const SERVER_FETCH_REVALIDATE_SECONDS = ONE_HOUR_SECONDS
