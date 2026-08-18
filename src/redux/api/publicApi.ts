import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { baseUrl as apiBaseUrl } from './api'

/** Public vcard API — always `{NEXT_PUBLIC_API_URL}/public`. */
export const baseUrl = `${apiBaseUrl.replace(/\/$/, '')}/public`

/** Default unused-data TTL — public card settings must refresh quickly. */
const DEFAULT_KEEP_UNUSED_SECONDS = 15

/** One retry only — extra 429 retries burn the remaining public request budget. */
const MAX_RATE_LIMIT_RETRIES = 1
/** Cap any single backoff wait so the UI never hangs too long. */
const MAX_RETRY_DELAY_MS = 8000

const rawBaseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  credentials: 'omit',
  fetchFn: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json')
    return headers
  },
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function retryDelayMs(error: FetchBaseQueryError, attempt: number): number {
  const meta = (error as { meta?: { response?: Response } }).meta
  const retryAfter = meta?.response?.headers.get('Retry-After')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS)
    }
  }
  // Exponential backoff with jitter: 0.5s, 1s, 2s … capped.
  const backoff = Math.min(500 * 2 ** attempt, MAX_RETRY_DELAY_MS)
  return backoff + Math.floor(Math.random() * 250)
}

/** Base query that transparently retries on HTTP 429, honoring `Retry-After`. */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, apiCtx, extraOptions) => {
  let result = await rawBaseQuery(args, apiCtx, extraOptions)

  for (let attempt = 0; result.error?.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES; attempt++) {
    await sleep(retryDelayMs(result.error, attempt))
    if (apiCtx.signal?.aborted) break
    result = await rawBaseQuery(args, apiCtx, extraOptions)
  }

  return result
}

export const publicApi = createApi({
  reducerPath: 'publicApi',
  baseQuery: baseQuery,
  keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
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
