import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const MENU_SECTION = 'Menu'

export const menuApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMenu: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(MENU_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, MENU_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Menu', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetMenuQuery, useLazyGetMenuQuery } = menuApi
