import { api, baseUrl } from '@/redux/api/api'
import type { RootState } from '@/redux/store'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export type AdminProfileRow = {
  id: string
  slug: string | null
  name: string
  email: string
  companyName: string | null
  designation: string | null
  phone: string | null
  whatsapp: string | null
  website?: string | null
  avatar: string | null
  isPublic: boolean
  isDraft?: boolean
  viewCount: number
  clickCount?: number
  saveCount?: number
  shareCount?: number
  facebook?: string | null
  instagram?: string | null
  twitter?: string | null
  tiktok?: string | null
  youtube?: string | null
  linkedin?: string | null
  rumble?: string | null
  truth?: string | null
  socialClicks?: Array<{ channel: string; label: string; clickCount: number }>
  createdAt: string
  updatedAt: string
  status: { id: string; name: string } | null
  profession: { id: string; name: string } | null
  user: { id: string; name: string | null; email: string; role: string } | null
  companyUser: { id: string; name: string | null; email: string; role?: string } | null
  createdBy?: { id: string; name: string | null; email: string; role?: string } | null
}

export type AdminProfilesListPage = {
  items: AdminProfileRow[]
  total: number
  skip: number
  limit: number | null
  showAll: boolean
}

export type AdminProfileFilterOptions = {
  statuses: { id: string; name: string }[]
  professions: { id: string; name: string }[]
}

export type AdminProfilesListQuery = {
  q?: string
  status?: string
  profession?: string
  lifecycle?: 'active' | 'draft'
  skip?: number
  limit?: number
  showAll?: boolean
  sortBy?: 'updatedAt' | 'createdAt' | 'name' | 'viewCount' | 'companyName'
  sortDir?: 'asc' | 'desc'
}

export type AdminProfilesExportQuery = {
  q?: string
  status?: string
  profession?: string
  lifecycle?: 'active' | 'draft'
  sortBy?: AdminProfilesListQuery['sortBy']
  sortDir?: AdminProfilesListQuery['sortDir']
}

function appendFilterParams(search: URLSearchParams, params?: AdminProfilesExportQuery) {
  if (params?.q?.trim()) search.set('q', params.q.trim())
  if (params?.status && params.status.toLowerCase() !== 'all') search.set('status', params.status)
  if (params?.profession && params.profession.toLowerCase() !== 'all') {
    search.set('profession', params.profession)
  }
  if (params?.lifecycle) search.set('lifecycle', params.lifecycle)
  if (params?.sortBy) search.set('sortBy', params.sortBy)
  if (params?.sortDir) search.set('sortDir', params.sortDir)
}

function buildListSearch(params?: AdminProfilesListQuery) {
  const search = new URLSearchParams()
  appendFilterParams(search, params)
  if (params?.showAll) {
    search.set('showAll', 'true')
  } else {
    search.set('skip', String(params?.skip ?? 0))
    search.set('limit', String(params?.limit ?? 20))
  }
  return search
}

const adminProfilesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminProfiles: builder.query<AdminProfilesListPage, AdminProfilesListQuery | void>({
      query: (params) => `/admin/profiles?${buildListSearch(params || undefined).toString()}`,
      transformResponse: (res: Envelope<AdminProfilesListPage>) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({ type: 'adminProfiles' as const, id: p.id })),
              { type: 'adminProfiles' as const, id: 'LIST' },
            ]
          : [{ type: 'adminProfiles', id: 'LIST' }],
    }),
    getAdminProfileFilters: builder.query<AdminProfileFilterOptions, void>({
      query: () => '/admin/profiles/filters',
      transformResponse: (res: Envelope<AdminProfileFilterOptions>) => res.data,
      providesTags: [{ type: 'adminProfiles', id: 'FILTERS' }],
    }),
  }),
})

export async function exportAdminProfilesCsv(
  params: AdminProfilesExportQuery | undefined,
  getToken: () => string | undefined
) {
  const search = new URLSearchParams()
  appendFilterParams(search, params)
  const res = await fetch(`${baseUrl}/admin/profiles/export?${search.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  })
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vcards-export-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function selectAuthToken(state: RootState): string | undefined {
  return state.user?.token || undefined
}

export const { useGetAdminProfilesQuery, useLazyGetAdminProfilesQuery, useGetAdminProfileFiltersQuery } =
  adminProfilesApi

export default adminProfilesApi
