import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const PROPERTY_LISTING_SECTION = 'Property Listing'

export const propertyListingApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPropertyListing: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(PROPERTY_LISTING_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, PROPERTY_LISTING_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'PropertyListing', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetPropertyListingQuery, useLazyGetPropertyListingQuery } = propertyListingApi
