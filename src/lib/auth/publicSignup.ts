/** Public self-serve signup is hidden; accounts are created by admin. */
export const PUBLIC_SIGNUP_ENABLED =
  (process.env.NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED || 'false').trim().toLowerCase() === 'true'

export const PUBLIC_SIGNUP_PATH = '/register'
export const PUBLIC_SIGNUP_FALLBACK_PATH = '/login'
