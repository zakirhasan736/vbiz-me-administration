import { normalizePublicCardsResponse } from '@/lib/api/publicCards/mapPublicCards'
import { buildPublicCardsQueryPath } from '@/lib/publicCards/publicCardsSearch'
import { publicApi as api } from '@/redux/api/publicApi'
import type { PublicCardsQueryResult, PublicCardsResponse, PublicCardsSearchParams } from '@interfaces/api/publicCards'

export const publicCardsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Paginated directory from `GET /public-cards` (supports search filters). */
    getPublicCards: build.query<PublicCardsQueryResult, PublicCardsSearchParams | void>({
      query: (params) => buildPublicCardsQueryPath(params ?? undefined),
      transformResponse: (response: PublicCardsResponse) => normalizePublicCardsResponse(response),
      providesTags: ['PublicCards'],
    }),
  }),
  overrideExisting: true,
})

export const { useGetPublicCardsQuery, useLazyGetPublicCardsQuery } = publicCardsApi
