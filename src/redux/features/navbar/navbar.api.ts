import type { NavBarLinksData, NavBarLinksResponse } from '@/interfaces/navbarLinks.interface'
import { publicApi as api } from '@/redux/api/publicApi'

function assertNavBarLinksResponse(response: NavBarLinksResponse): NavBarLinksData {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load navbar links')
  }
  return response.data
}

export const navBarLinksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNavBarLinks: builder.query<NavBarLinksData, string>({
      query: (profileId) => `/post-types?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: assertNavBarLinksResponse,
      providesTags: ['NavBarLinks'],
    }),
  }),
  overrideExisting: true,
})
export const { useGetNavBarLinksQuery, useLazyGetNavBarLinksQuery } = navBarLinksApi
