import type { AdminStaffRoleName } from '@/lib/admin/adminPermissions'
import { api } from '@/redux/api/api'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export type AdminTeamMemberRow = {
  id: string
  name: string | null
  email: string
  role: 'admin' | 'super-admin' | string
  staffRole: string | null
  allowedModules: string[]
  isActive: boolean
  accountStatus: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export type CreateAdminTeamBody = {
  name: string
  email: string
  password: string
  staffRole: AdminStaffRoleName
  allowedModules: string[]
}

export type UpdateAdminTeamBody = {
  name?: string
  staffRole?: AdminStaffRoleName
  allowedModules?: string[]
}

const adminTeamApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminTeam: builder.query<AdminTeamMemberRow[], void>({
      query: () => '/admin/team',
      transformResponse: (res: Envelope<AdminTeamMemberRow[]>) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((m) => ({ type: 'adminTeam' as const, id: m.id })),
              { type: 'adminTeam' as const, id: 'LIST' },
            ]
          : [{ type: 'adminTeam', id: 'LIST' }],
    }),
    createAdminTeamMember: builder.mutation<AdminTeamMemberRow, CreateAdminTeamBody>({
      query: (body) => ({
        url: '/admin/team',
        method: 'POST',
        body,
      }),
      transformResponse: (res: Envelope<AdminTeamMemberRow>) => res.data,
      invalidatesTags: [{ type: 'adminTeam', id: 'LIST' }],
    }),
    updateAdminTeamMember: builder.mutation<AdminTeamMemberRow, { id: string; body: UpdateAdminTeamBody }>({
      query: ({ id, body }) => ({
        url: `/admin/team/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<AdminTeamMemberRow>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'adminTeam', id: arg.id },
        { type: 'adminTeam', id: 'LIST' },
      ],
    }),
    setAdminTeamStatus: builder.mutation<AdminTeamMemberRow, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/admin/team/${id}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      transformResponse: (res: Envelope<AdminTeamMemberRow>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'adminTeam', id: arg.id },
        { type: 'adminTeam', id: 'LIST' },
      ],
    }),
    removeAdminTeamMember: builder.mutation<null, string>({
      query: (id) => ({
        url: `/admin/team/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res: Envelope<null>) => res.data,
      invalidatesTags: [{ type: 'adminTeam', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetAdminTeamQuery,
  useCreateAdminTeamMemberMutation,
  useUpdateAdminTeamMemberMutation,
  useSetAdminTeamStatusMutation,
  useRemoveAdminTeamMemberMutation,
} = adminTeamApi
