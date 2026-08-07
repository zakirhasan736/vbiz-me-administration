import { baseUrl as publicApiBaseUrl } from '@/redux/api/publicApi'

const ONE_HOUR_SECONDS = 60 * 60

/** Public card API base (`/api/v1/public`). */
export function getApiBaseUrl(): string {
  return publicApiBaseUrl.replace(/\/$/, '')
}

export const SERVER_FETCH_REVALIDATE_SECONDS = ONE_HOUR_SECONDS
