import { AUTH_PROVIDER_LABELS, PASSWORD_SETUP_REQUIRED } from '@/constants'
import type { IQueryMutationErrorResponse, TPasswordSetupRequiredData } from '@/interfaces'

export function isPasswordSetupRequired(error: IQueryMutationErrorResponse | undefined): boolean {
  return error?.data?.code === PASSWORD_SETUP_REQUIRED && typeof error?.data?.data?.email === 'string'
}

export function getPasswordSetupRequiredData(error: IQueryMutationErrorResponse): TPasswordSetupRequiredData | null {
  const email = error.data.data?.email
  if (!email) return null

  return {
    email,
    providers: Array.isArray(error.data.data?.providers)
      ? error.data.data.providers.filter((p): p is string => typeof p === 'string')
      : [],
    hasPassword: Boolean(error.data.data?.hasPassword),
  }
}

export function getProviderLabel(provider?: string) {
  if (!provider) return 'social login'
  return AUTH_PROVIDER_LABELS[provider] ?? 'social login'
}
