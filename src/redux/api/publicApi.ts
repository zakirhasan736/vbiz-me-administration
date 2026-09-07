import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { baseUrl as apiBaseUrl } from './api'

/** Public vcard API — always `{NEXT_PUBLIC_API_URL}/public`. */
export const baseUrl = `${apiBaseUrl.replace(/\/$/, '')}/public`

/** Keep section payloads long enough that tab switches don't re-hit the shared public rate limit. */
const DEFAULT_KEEP_UNUSED_SECONDS = 120

const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  credentials: 'omit',
  fetchFn: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json')
    return headers
  },
})

export const publicApi = createApi({
  reducerPath: 'publicApi',
  baseQuery,
  keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
  // Seconds: avoid remount storms when switching public card tabs.
  refetchOnMountOrArgChange: 60,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  tagTypes: [
    'MyCard',
    'PublicCards',
    'NavBarLinks',
    'DynamicSection',
    'ProfileAiData',
    'ProfileSettings',
    'PublicAnnouncement',
    'AboutMe',
    'Services',
    'Gallery',
    'Reviews',
    'Clients',
    'Videos',
    'VideoExplainer',
  ],
  endpoints: () => ({}),
})
