import { api } from '@/redux/api/api'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export type AdminPackageFeature = {
  id?: string
  featureKey: string
  featureValue?: string | null
}

export type AdminPackageRow = {
  id: string
  name: string
  slug: string | null
  description: string | null
  monthlyPrice: number
  yearlyPrice: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  features: AdminPackageFeature[]
  subscriberCount: number
}

export type PackageSubscriber = {
  subscriptionId: string
  userId: string
  name: string | null
  email: string
  stripeStatus: string | null
  createdAt: string
}

export type AdminPackageDetail = AdminPackageRow & {
  subscribers: PackageSubscriber[]
}

export type UpsertAdminPackageBody = {
  name: string
  slug?: string | null
  description?: string | null
  monthlyPrice: number
  yearlyPrice: number
  isActive?: boolean
  sortOrder?: number
  features?: { featureKey: string; featureValue?: string | null }[]
}

export type UpdateAdminPackageBody = Partial<UpsertAdminPackageBody>

const adminPackagesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminPackages: builder.query<AdminPackageRow[], void>({
      query: () => '/admin/packages',
      transformResponse: (res: Envelope<AdminPackageRow[]>) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: 'adminPackages' as const, id: p.id })),
              { type: 'adminPackages' as const, id: 'LIST' },
            ]
          : [{ type: 'adminPackages', id: 'LIST' }],
    }),
    getAdminPackage: builder.query<AdminPackageDetail, string>({
      query: (id) => `/admin/packages/${id}`,
      transformResponse: (res: Envelope<AdminPackageDetail>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'adminPackages', id }],
    }),
    createAdminPackage: builder.mutation<AdminPackageRow, UpsertAdminPackageBody>({
      query: (body) => ({
        url: '/admin/packages',
        method: 'POST',
        body,
      }),
      transformResponse: (res: Envelope<AdminPackageRow>) => res.data,
      invalidatesTags: [{ type: 'adminPackages', id: 'LIST' }],
    }),
    updateAdminPackage: builder.mutation<AdminPackageRow, { id: string; body: UpdateAdminPackageBody }>({
      query: ({ id, body }) => ({
        url: `/admin/packages/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<AdminPackageRow>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'adminPackages', id: arg.id },
        { type: 'adminPackages', id: 'LIST' },
      ],
    }),
    deleteAdminPackage: builder.mutation<null, string>({
      query: (id) => ({
        url: `/admin/packages/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res: Envelope<null>) => res.data,
      invalidatesTags: [{ type: 'adminPackages', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetAdminPackagesQuery,
  useGetAdminPackageQuery,
  useCreateAdminPackageMutation,
  useUpdateAdminPackageMutation,
  useDeleteAdminPackageMutation,
} = adminPackagesApi
