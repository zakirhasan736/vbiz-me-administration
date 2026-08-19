import type {
  TChangePasswordPayload,
  TForgotPasswordPayload,
  TLoginPayload,
  TRegisterPayload,
  TUpdateProfilePayload,
  TVerifyEmailPayload,
} from '@/interfaces'
import { IUser } from '@/interfaces/user.interface'
import { api, baseUrl } from '@/redux/api/api'

export const googleAuthUrl = `${baseUrl}/auth/google`
export const facebookAuthUrl = `${baseUrl}/auth/facebook`

const redirectToOAuth = (url: string) => {
  if (typeof window !== 'undefined') {
    window.location.assign(url)
  }
  return { data: null }
}

const authApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    register: builder.mutation<
      { data: { cooldownEnd: number; remainingSecond: number; expiresAt?: number } },
      TRegisterPayload
    >({
      query: (payload) => ({
        url: '/auth/register',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['auth'],
    }),
    sendVerificationEmail: builder.mutation<
      { data: { cooldownEnd: number; remainingSecond: number; expiresAt?: number } },
      string
    >({
      query: (email) => ({
        url: '/auth/send-verification-email',
        method: 'POST',
        body: { email },
      }),
      invalidatesTags: ['auth'],
    }),
    verifyEmail: builder.mutation<{ data: null }, TVerifyEmailPayload>({
      query: (payload) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['auth'],
    }),
    login: builder.mutation<{ data: { profile: IUser; accessToken: string } }, TLoginPayload>({
      query: (payload) => ({
        url: '/auth/login',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['auth'],
    }),
    verifyLoginOtp: builder.mutation<{ data: { profile: IUser; accessToken: string } }, { email: string; otp: string }>(
      {
        query: (payload) => ({
          url: '/auth/login-otp/verify',
          method: 'POST',
          body: payload,
        }),
        invalidatesTags: ['auth'],
      }
    ),
    resendLoginOtp: builder.mutation<
      { data: { cooldownEnd: number; remainingSecond: number; expiresAt?: number } },
      { email: string }
    >({
      query: (payload) => ({
        url: '/auth/login-otp/resend',
        method: 'POST',
        body: payload,
      }),
    }),
    updateProfile: builder.mutation<
      { data: { user: IUser; accessToken?: string; refreshToken?: string } },
      TUpdateProfilePayload
    >({
      query: (payload) => ({
        url: '/auth/update',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['auth'],
    }),
    googleLogin: builder.mutation<null, void>({
      // Passport OAuth is browser-redirect based — XHR cannot complete this flow.
      queryFn: () => redirectToOAuth(googleAuthUrl),
    }),
    facebookLogin: builder.mutation<null, void>({
      queryFn: () => redirectToOAuth(facebookAuthUrl),
    }),
    logout: builder.mutation<{ data: null }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['auth'],
    }),
    forgotPassword: builder.mutation<{ data: null }, TForgotPasswordPayload>({
      query: (payload) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: payload,
      }),
    }),
    verifyForgotPassword: builder.mutation<{ data: { email: string } }, { token: string }>({
      query: (payload) => ({
        url: '/auth/forgot-password/verify',
        method: 'POST',
        body: payload,
      }),
    }),
    verifyPasswordSetup: builder.mutation<{ data: { email: string; providers: string[] } }, { token: string }>({
      query: (payload) => ({
        url: '/auth/password-setup/verify',
        method: 'POST',
        body: payload,
      }),
    }),
    resendPasswordSetup: builder.mutation<{ data: null }, { email: string }>({
      query: (payload) => ({
        url: '/auth/password-setup/resend',
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
      invalidatesTags: ['auth'],
    }),
    changePassword: builder.mutation<{ data: null }, TChangePasswordPayload>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['auth'],
    }),
    deactivateAccount: builder.mutation<{ data: null }, undefined>({
      query: () => ({
        url: '/auth/deactivate',
        method: 'POST',
      }),
      invalidatesTags: ['auth'],
    }),
    getAuthor: builder.query<{ data: IUser }, undefined>({
      query: () => {
        return {
          url: `/auth/author`,
          method: 'GET',
        }
      },
      providesTags: ['auth'],
    }),
    persistTours: builder.mutation<
      { data: { completedTours: string[] } },
      { keys: Array<'dashboard' | 'create_card'> }
    >({
      query: (payload) => ({
        url: '/auth/tours',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['auth'],
    }),
  }),
})

export const {
  useRegisterMutation,
  useSendVerificationEmailMutation,
  useVerifyEmailMutation,
  useLoginMutation,
  useVerifyLoginOtpMutation,
  useResendLoginOtpMutation,
  useUpdateProfileMutation,
  useGoogleLoginMutation,
  useFacebookLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useVerifyForgotPasswordMutation,
  useVerifyPasswordSetupMutation,
  useResendPasswordSetupMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetAuthorQuery,
  usePersistToursMutation,
} = authApi
