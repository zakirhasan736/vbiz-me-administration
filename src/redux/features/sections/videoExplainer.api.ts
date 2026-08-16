import type {
  VideoExplainerQueryResult,
  VideoExplainerSectionResponse,
} from '@/interfaces/api/videoExplainer.interface'
import { normalizeVideoExplainerResponse } from '@/lib/api/videoExplainer/mapVideoExplainer'
import { publicApi as api } from '@/redux/api/publicApi'

const VIDEO_EXPLAINER_SECTION = '2D Video Explainer'

export const videoExplainerApi = api.injectEndpoints({
  endpoints: (build) => ({
    getVideoExplainer: build.query<VideoExplainerQueryResult, string>({
      query: (profileId) =>
        `/dynamic-section/${encodeURIComponent(VIDEO_EXPLAINER_SECTION)}?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: VideoExplainerSectionResponse) => normalizeVideoExplainerResponse(response),
      providesTags: (_result, _error, profileId) => [{ type: 'VideoExplainer', id: profileId }],
    }),
  }),
  overrideExisting: true,
})

export const { useGetVideoExplainerQuery, useLazyGetVideoExplainerQuery } = videoExplainerApi
