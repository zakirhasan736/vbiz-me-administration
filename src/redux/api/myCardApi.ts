import type { MyCardData, MyCardResponse } from '@interfaces/api/myCard'
import { publicApi as api } from './publicApi'

function assertMyCardResponse(response: MyCardResponse): MyCardData {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Profile not found')
  }
  return response.data
}

const ONE_HOUR_SECONDS = 60 * 60

export const myCardApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Raw MyCard payload from `GET /v/{slug}`. */
    getMyCardBySlug: build.query<MyCardData, string>({
      query: (slug) => `/v/${encodeURIComponent(slug.trim())}`,
      transformResponse: assertMyCardResponse,
      providesTags: (_result, _error, slug) => [{ type: 'MyCard', id: slug }],
      keepUnusedDataFor: ONE_HOUR_SECONDS,
    }),
  }),
  overrideExisting: false,
})

export const { useGetMyCardBySlugQuery, useLazyGetMyCardBySlugQuery } = myCardApi
