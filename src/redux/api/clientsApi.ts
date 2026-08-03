import type { ClientsQueryResult } from '@/interfaces/api/clients.interface'
import { normalizeClientsResponse } from '@/lib/api/clients/mapClients'
import { publicApi as api } from './publicApi'

export const clientsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getClients: build.query<ClientsQueryResult, string>({
      query: (profileId) => `/dynamic-section/clients?profile_id=${encodeURIComponent(profileId.trim())}`,
      transformResponse: normalizeClientsResponse,
      providesTags: (_result, _error, profileId) => [{ type: 'Clients', id: profileId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetClientsQuery, useLazyGetClientsQuery } = clientsApi
