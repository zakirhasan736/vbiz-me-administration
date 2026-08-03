import type { VideoSectionResponse, VideosQueryResult } from '@/interfaces/api/videos.interface'
import { normalizeVideosResponse } from '@/lib/api/videos/mapVideos'
import { publicApi as api } from './publicApi'

const VIDEOS_SECTION = 'video'

export const videosApi = api.injectEndpoints({
  endpoints: (build) => ({
    getVideos: build.query<VideosQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(VIDEOS_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: VideoSectionResponse) => normalizeVideosResponse(response),
      providesTags: (_result, _error, profileId) => [{ type: 'Videos', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetVideosQuery, useLazyGetVideosQuery } = videosApi
