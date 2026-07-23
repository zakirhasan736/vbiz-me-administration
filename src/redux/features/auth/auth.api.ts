import { IUser } from '@/interfaces/user.interface'
import { api } from '@/redux/api/api'

const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    sendVerificationEmail: builder.mutation<{ data: { cooldownEnd: number; remainingSecond: number } }, string>({
      query: (email) => ({
        url: '/auth/send-verification-email',
        method: 'POST',
        body: { email },
      }),
      invalidatesTags: ['user'],
    }),
    verifyEmail: builder.mutation<{ data: null }, { otp: number; email: string }>({
      query: (payload) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['user'],
    }),
    login: builder.mutation<{ data: { profile: IUser; accessToken: string } }, { email: string; password: string }>({
      query: (payload) => ({
        url: '/auth/login',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['user'],
    }),
    logout: builder.mutation<{ data: null }, undefined>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['user'],
    }),
    forgotPassword: builder.mutation<{ data: null }, { email: string }>({
      query: (payload) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: payload,
      }),
    }),
    resetPassword: builder.mutation<{ data: null }, { token: string; password: string }>({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['user'],
    }),
    changePassword: builder.mutation<{ data: null }, { oldPassword: string; password: string }>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['user'],
    }),
    deactivateAccount: builder.mutation<{ data: null }, undefined>({
      query: () => ({
        url: '/auth/deactivate',
        method: 'POST',
      }),
      invalidatesTags: ['user'],
    }),
    getAuthor: builder.query<{ data: IUser }, undefined>({
      query: () => {
        return {
          url: `/auth/profile`,
          method: 'GET',
        }
      },
      providesTags: ['user'],
    }),
  }),
})
export const {
  useSendVerificationEmailMutation,
  useVerifyEmailMutation,
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetAuthorQuery,
} = userApi
