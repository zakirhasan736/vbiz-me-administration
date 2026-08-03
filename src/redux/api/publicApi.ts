import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'

/** Laravel public vcard API (template-services parity). */
export const baseUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'https://app.vbizme.com/api'

const ONE_HOUR_SECONDS = 60 * 60

/** Max times a single request is retried after a 429 before giving up. */
const MAX_RATE_LIMIT_RETRIES = 3
/** Cap any single backoff wait so the UI never hangs too long. */
const MAX_RETRY_DELAY_MS = 8000

const rawBaseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  credentials: 'omit',
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
  /** Public profile sections are mostly static — cache 1h to avoid repeat tab visits refetching. */
  keepUnusedDataFor: ONE_HOUR_SECONDS,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  tagTypes: [
    'user',
    'MyCard',
    'PublicCards',
    'NavBarLinks',
    'Clients',
    'Blog',
    'Post',
    'Services',
    'Calendar',
    'Events',
    'Gallery',
    'Reviews',
    'AboutMe',
    'VideoExplainer',
    'AdditionalServices',
    'BbbAccreditation',
    'Dcp',
    'MeetOurTeam',
    'Faq',
    'Booking',
    'Menu',
    'SalesPerson',
    'SeeProducts',
    'VideoLinks',
    'Videos',
    'MissionStatement',
    'WhyChooseUs',
    'JoinMyTeam',
    'HomeSolar',
    'ResiliencyProducts',
    'PropertyListing',
    'MediaPress',
    'Announcement',
    'CertificationsLicensing',
    'Breakfast',
    'Dinner',
    'Lunch',
    'Inventory',
    'Licensing',
    'InsuranceLicense',
    'Resume',
    'WorkExperience',
    'DynamicSection',
    'ProfileAiData',
    'ProfileSettings',
  ],
  endpoints: () => ({}),
})
