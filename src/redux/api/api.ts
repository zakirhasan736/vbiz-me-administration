/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirectToLogin, redirectToRoleHome, shouldSilentlyRefreshSession } from '@/lib/auth/sessionPolicy'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import Cookies from 'js-cookie'
import { logout, updateAuthState } from '../features/auth/user.slice'
import { RootState } from '../store'

export const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const clearServerSession = () =>
  fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => undefined)

let refreshPromise: Promise<string | null> | null = null

function refreshAccessToken(token: string | null): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(`${baseUrl}/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
    .then(async (res) => {
      if (!res.ok) return null

      try {
        const data = (await res.json()) as {
          success?: boolean
          data?: { accessToken?: string }
        }
        return data?.success && data?.data?.accessToken ? data.data.accessToken : null
      } catch {
        return null
      }
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

const expireSession = async (api: any) => {
  Cookies.remove('redirect_after_login')
  await clearServerSession()
  api?.dispatch(logout())
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
    await expireSession(api)
    return result
  }

  if (result?.error?.status === 401) {
    const state = api.getState() as RootState
    const token = state?.user?.token
    const role = state?.user?.user?.role

    if (!shouldSilentlyRefreshSession(role)) {
      await expireSession(api)
      return result
    }

    const accessToken = await refreshAccessToken(token)
    if (!accessToken) {
      await expireSession(api)
      return result
    }

    api?.dispatch(updateAuthState({ token: accessToken }))
    redirectToRoleHome(role)
    result = await baseQuery(args, api, extraOptions)
    return result
  }

  if (
    result?.error?.status === 403 &&
    typeof result.error.data === 'object' &&
    result.error.data !== null &&
    'message' in result.error.data &&
    result.error.data.message === 'Unauthorized'
  ) {
    await expireSession(api)
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
  ],
  endpoints: () => ({}),
})
