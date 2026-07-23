/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import Cookies from 'js-cookie'
import { logout, updateAuthState } from '../features/auth/user.slice'
import { RootState } from '../store'

export const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState)?.user?.token
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})
const baseQueryWithRefreshToken = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 419) {
    // session expired
    Cookies.remove('redirect_after_login')
    api?.dispatch(logout())
    return result
  }

  if (result?.error?.status === 401) {
    const state = api.getState() as RootState
    const token = state?.user?.token

    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (res.status == 419) {
      Cookies.remove('redirect_after_login')
      api?.dispatch(logout())
      return result
    }

    const data = (await res.json()) as {
      success: boolean
      data: {
        accessToken: string
      }
    }

    if (data?.success && data?.data?.accessToken) {
      api?.dispatch(updateAuthState({ token: data?.data?.accessToken }))
      result = await baseQuery(args, api, extraOptions)
    }
    return result
  }

  return result
}
export const api = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithRefreshToken,
  tagTypes: ['user'],
  endpoints: () => ({}),
})
