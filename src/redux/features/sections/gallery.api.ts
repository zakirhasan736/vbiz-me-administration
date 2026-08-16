import type { GalleryQueryResult, GallerySectionResponse } from '@/interfaces/api/gallery.interface'
import { normalizeGalleryResponse } from '@/lib/api/gallery/mapGallery'
import { publicApi as api } from '@/redux/api/publicApi'

export const galleryApi = api.injectEndpoints({
  endpoints: (build) => ({
    getGallery: build.query<GalleryQueryResult, string>({
      query: (profileId) => `/dynamic-section/gallery?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: GallerySectionResponse) => normalizeGalleryResponse(response),
      providesTags: (_result, _error, profileId) => [{ type: 'Gallery', id: profileId }],
    }),
  }),
  overrideExisting: true,
})

export const { useGetGalleryQuery, useLazyGetGalleryQuery } = galleryApi
