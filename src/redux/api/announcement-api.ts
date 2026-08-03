import type { DynamicPostsQueryResult, DynamicPostsSectionResponse } from '@/interfaces/api/dynamicPosts.interface'
import { normalizeDynamicPostsResponse } from '@/lib/api/dynamicPosts/mapDynamicPosts'
import { publicApi as api } from './publicApi'

const ANNOUNCEMENT_SECTION = 'Announcement'

export const announcementApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAnnouncement: build.query<DynamicPostsQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(ANNOUNCEMENT_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: DynamicPostsSectionResponse) =>
        normalizeDynamicPostsResponse(response, ANNOUNCEMENT_SECTION),
      providesTags: (_result, _error, profileId) => [{ type: 'Announcement', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetAnnouncementQuery, useLazyGetAnnouncementQuery } = announcementApi
