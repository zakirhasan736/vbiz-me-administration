/* eslint-disable @typescript-eslint/no-explicit-any */
import { refreshSession } from '@/lib/auth/sessionClient'
import { isAuthenticatedWorkspacePath, redirectToLogin } from '@/lib/auth/sessionPolicy'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { updateAuthState } from '../features/auth/user.slice'
import { RootState } from '../store'

export const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const handleExpiredSession = (api: any) => {
  const state = api?.getState?.() as RootState | undefined
  if (!state?.user?.user?.id) return
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

export const baseQueryWithRefreshToken = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 419) {
    handleExpiredSession(api)
    return result
  }

  if (result?.error?.status === 401) {
    const state = api.getState() as RootState
    const token = state?.user?.token

    if (!isAuthenticatedWorkspacePath(typeof window === 'undefined' ? '' : window.location.pathname)) {
      return result
    }

    const refreshed = await refreshSession(token)
    if (!refreshed.accessToken) {
      handleExpiredSession(api)
      return result
    }

    api?.dispatch(updateAuthState({ token: refreshed.accessToken }))
    result = await baseQuery(args, api, extraOptions)
    if (result?.error?.status === 401 || result?.error?.status === 419) {
      handleExpiredSession(api)
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
    handleExpiredSession(api)
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
