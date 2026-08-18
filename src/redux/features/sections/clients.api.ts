import type { ClientsQueryResult, ClientsSectionResponse } from '@/interfaces/api/clients.interface'
import { normalizeClientsResponse } from '@/lib/api/clients/mapClients'
import { reportPublicSectionMedia } from '@/lib/api/reportPublicSectionMedia'
import { publicApi as api } from '@/redux/api/publicApi'

export const clientsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getClients: build.query<ClientsQueryResult, string>({
      query: (profileId) => `/dynamic-section/clients?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: (response: ClientsSectionResponse) => {
        const mapped = normalizeClientsResponse(response)
        reportPublicSectionMedia('clients', response, mapped)
        return mapped
      },
      providesTags: (_result, _error, profileId) => [{ type: 'Clients', id: profileId }],
    }),
  }),
  overrideExisting: true,
})

export const { useGetClientsQuery, useLazyGetClientsQuery } = clientsApi
