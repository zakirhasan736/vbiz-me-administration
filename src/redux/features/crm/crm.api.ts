import { api } from '@/redux/api/api'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export type CrmDashboardScope = 'admin' | 'corporate' | 'single'

export type CrmDashboard = {
  scope: CrmDashboardScope
  metrics: {
    newLeads: number
    openLeads: number
  }
}

const crmApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCrmDashboard: builder.query<CrmDashboard, void>({
      query: () => '/crm/dashboard',
      transformResponse: (res: Envelope<CrmDashboard>) => res.data,
      providesTags: [{ type: 'crm', id: 'DASHBOARD' }],
    }),
  }),
})

export const { useGetCrmDashboardQuery } = crmApi

export default crmApi
