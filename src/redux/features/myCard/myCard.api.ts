import { publicApi as api } from '@/redux/api/publicApi'
import type { MyCardData, MyCardResponse } from '@interfaces/api/myCard'

function assertMyCardResponse(response: MyCardResponse): MyCardData {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Profile not found')
  }
  return response.data
}

export const myCardApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Raw MyCard payload from `GET /v/{slug}`. */
    getMyCardBySlug: build.query<MyCardData, string>({
      query: (slug) => `/v/${encodeURIComponent(slug.trim())}`,
      transformResponse: assertMyCardResponse,
      providesTags: (_result, _error, slug) => [{ type: 'MyCard', id: slug }],
      keepUnusedDataFor: 15,
    }),
  }),
  overrideExisting: true,
})

export const { useGetMyCardBySlugQuery, useLazyGetMyCardBySlugQuery } = myCardApi
