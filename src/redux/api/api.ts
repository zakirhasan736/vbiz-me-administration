/* eslint-disable @typescript-eslint/no-explicit-any */
import { refreshSession } from '@/lib/auth/sessionClient'
import { isAuthenticatedWorkspacePath, redirectToLogin } from '@/lib/auth/sessionPolicy'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout as clearAuth, updateAuthState } from '../features/auth/user.slice'
import { RootState } from '../store'

export const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const handleExpiredSession = (queryApi: { getState?: () => unknown; dispatch?: (action: unknown) => unknown }) => {
  const state = queryApi?.getState?.() as RootState | undefined
  if (!state?.user?.user?.id && !state?.user?.token) return
  // Drop local session immediately so RTK / banners stop hammering the API with 401s.
  queryApi?.dispatch?.(clearAuth())
  queryApi?.dispatch?.(api.util.resetApiState())
  redirectToLogin()
}

const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState)?.user?.token
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

export const baseQueryWithRefreshToken = async (args: any, queryApi: any, extraOptions: any) => {
  let result = await baseQuery(args, queryApi, extraOptions)

  if (result?.error?.status === 419) {
    handleExpiredSession(queryApi)
    return result
  }

  if (result?.error?.status === 401) {
    const state = queryApi.getState() as RootState
    const token = state?.user?.token

    if (!isAuthenticatedWorkspacePath(typeof window === 'undefined' ? '' : window.location.pathname)) {
      return result
    }

    const refreshed = await refreshSession(token)
    if (!refreshed.accessToken) {
      handleExpiredSession(queryApi)
      return result
    }

    queryApi?.dispatch(updateAuthState({ token: refreshed.accessToken }))
    result = await baseQuery(args, queryApi, extraOptions)
    if (result?.error?.status === 401 || result?.error?.status === 419) {
      handleExpiredSession(queryApi)
    }
    return result
  }

  if (
    result?.error?.status === 403 &&
    typeof result.error.data === 'object' &&
    result.error.data !== null &&
    'message' in result.error.data &&
    result.error.data.message === 'Unauthorized'
  ) {
    handleExpiredSession(queryApi)
  }

  return result
}

export const api = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithRefreshToken,
  tagTypes: [
    'auth',
    'profiles',
    'dashboard',
    'crm',
    'meetings',
    'activity',
    'adminProfiles',
    'adminUsers',
    'adminLeads',
    'adminSupport',
    'adminAnnouncements',
    'adminTemplates',
    'templates',
    'adminPackages',
    'adminTeam',
    'oneOnOne',
  ],
  endpoints: () => ({}),
})
