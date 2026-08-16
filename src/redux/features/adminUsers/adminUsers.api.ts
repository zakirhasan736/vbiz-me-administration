import { api } from '@/redux/api/api'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export type AdminUserAccountStatus = 'ACTIVE' | 'PAUSED' | 'SUSPENDED'

export type AdminUserRole = 'vcard-owner' | 'corporate-owner' | 'admin'

export type AdminUserRow = {
  id: string
  name: string | null
  email: string
  role: AdminUserRole | string
  companyName: string | null
  registeredCards: number
  accountStatus: AdminUserAccountStatus
  isActive: boolean
  isVerified: boolean
  createdAt: string
}

export type AdminUsersListPage = {
  items: AdminUserRow[]
  total: number
  skip: number
  limit: number
}

export type AdminUserStats = {
  singleOwners: number
  corporateOwners: number
  activeNow: number
  total: number
}

export type AdminUsersListQuery = {
  q?: string
  role?: AdminUserRole
  accountStatus?: AdminUserAccountStatus
  skip?: number
  limit?: number
}

export type CreateAdminUserBody = {
  name: string
  email: string
  password: string
  role: 'vcard-owner' | 'corporate-owner'
  companyName?: string | null
}

export type UpdateAdminUserBody = {
  name?: string
  email?: string
  role?: 'vcard-owner' | 'corporate-owner'
  companyName?: string | null
  password?: string
}

export type SetAdminUserStatusBody = {
  accountStatus: AdminUserAccountStatus
}

function buildListSearch(params?: AdminUsersListQuery) {
  const search = new URLSearchParams()
  if (params?.q?.trim()) search.set('q', params.q.trim())
  if (params?.role) search.set('role', params.role)
  if (params?.accountStatus) search.set('accountStatus', params.accountStatus)
  search.set('skip', String(params?.skip ?? 0))
  search.set('limit', String(params?.limit ?? 8))
  return search
}

const adminUsersApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminUsers: builder.query<AdminUsersListPage, AdminUsersListQuery | void>({
      query: (params) => `/admin/users?${buildListSearch(params || undefined).toString()}`,
      transformResponse: (res: Envelope<AdminUsersListPage>) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((u) => ({ type: 'adminUsers' as const, id: u.id })),
              { type: 'adminUsers' as const, id: 'LIST' },
            ]
          : [{ type: 'adminUsers', id: 'LIST' }],
    }),
    getAdminUserStats: builder.query<AdminUserStats, void>({
      query: () => '/admin/users/stats',
      transformResponse: (res: Envelope<AdminUserStats>) => res.data,
      providesTags: [{ type: 'adminUsers', id: 'STATS' }],
    }),
    createAdminUser: builder.mutation<AdminUserRow, CreateAdminUserBody>({
      query: (body) => ({
        url: '/admin/users',
        method: 'POST',
        body,
      }),
      transformResponse: (res: Envelope<AdminUserRow>) => res.data,
      invalidatesTags: [
        { type: 'adminUsers', id: 'LIST' },
        { type: 'adminUsers', id: 'STATS' },
      ],
    }),
    updateAdminUser: builder.mutation<AdminUserRow, { id: string; body: UpdateAdminUserBody }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<AdminUserRow>) => res.data,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'adminUsers', id: arg.id },
        { type: 'adminUsers', id: 'LIST' },
        { type: 'adminUsers', id: 'STATS' },
      ],
    }),
    setAdminUserStatus: builder.mutation<AdminUserRow, { id: string; body: SetAdminUserStatusBody }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<AdminUserRow>) => res.data,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'adminUsers', id: arg.id },
        { type: 'adminUsers', id: 'LIST' },
        { type: 'adminUsers', id: 'STATS' },
      ],
    }),
    deleteAdminUser: builder.mutation<null, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res: Envelope<null>) => res.data,
      invalidatesTags: [
        { type: 'adminUsers', id: 'LIST' },
        { type: 'adminUsers', id: 'STATS' },
      ],
    }),
  }),
})

export const {
  useGetAdminUsersQuery,
  useGetAdminUserStatsQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useSetAdminUserStatusMutation,
  useDeleteAdminUserMutation,
} = adminUsersApi

export default adminUsersApi
