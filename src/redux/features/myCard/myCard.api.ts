import { publicApi as api } from '@/redux/api/publicApi'
import type { MyCardData, MyCardResponse } from '@interfaces/api/myCard'

function assertMyCardResponse(response: MyCardResponse): MyCardData {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Profile not found')
  }
  return response.data
}

const FIVE_MINUTES_SECONDS = 5 * 60

export const myCardApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Raw MyCard payload from `GET /v/{slug}`. */
    getMyCardBySlug: build.query<MyCardData, string>({
      query: (slug) => `/v/${encodeURIComponent(slug.trim())}`,
      transformResponse: assertMyCardResponse,
      providesTags: (_result, _error, slug) => [{ type: 'MyCard', id: slug }],
      keepUnusedDataFor: FIVE_MINUTES_SECONDS,
    }),
  }),
  overrideExisting: true,
})

export const { useGetMyCardBySlugQuery, useLazyGetMyCardBySlugQuery } = myCardApi
