import { api } from '@/redux/api/api'

export type HealthStatus = {
  status: string
  uptime: number
}

type HealthResponse = {
  success: boolean
  statusCode: number
  message: string
  data: HealthStatus
}

const healthApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthStatus, void>({
      query: () => '/health',
      transformResponse: (response: HealthResponse) => response.data,
    }),
  }),
})

export const { useGetHealthQuery } = healthApi
