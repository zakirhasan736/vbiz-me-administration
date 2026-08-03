import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const INVENTORY_SECTION = 'Inventory'

export const inventoryApi = api.injectEndpoints({
  endpoints: (build) => ({
    getInventory: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(INVENTORY_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, INVENTORY_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Inventory', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetInventoryQuery, useLazyGetInventoryQuery } = inventoryApi
