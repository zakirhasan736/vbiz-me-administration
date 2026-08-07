import type { ServicesQueryResult, ServicesSectionResponse } from '@/interfaces/api/services.interface'
import { normalizeServicesResponse } from '@/lib/api/services/mapServices'
import { publicApi as api } from '@/redux/api/publicApi'

export const servicesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getServices: build.query<ServicesQueryResult, string>({
      query: (profileId) => `/dynamic-section/services?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: ServicesSectionResponse) => normalizeServicesResponse(response),
      providesTags: (_result, _error, profileId) => [{ type: 'Services', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetServicesQuery, useLazyGetServicesQuery } = servicesApi
