import { baseUrl as publicApiBaseUrl } from '@/redux/api/publicApi'

/** Public card API base (`/api/v1/public`). */
export function getApiBaseUrl(): string {
  return publicApiBaseUrl.replace(/\/$/, '')
}

/** Card identity/theme/SEO must never be ISR-cached. */
export const PUBLIC_CARD_FETCH_INIT: RequestInit = {
  cache: 'no-store',
}

/** @deprecated public card fetches use PUBLIC_CARD_FETCH_INIT instead. */
export const SERVER_FETCH_REVALIDATE_SECONDS = 0
