import { cookies } from 'next/headers'

export const CANVA_OAUTH_STATE_COOKIE = 'canva_oauth_state'
export const CANVA_CODE_VERIFIER_COOKIE = 'canva_code_verifier'
export const CANVA_USER_ID_COOKIE = 'canva_user_id'
export const CANVA_RETURN_TO_COOKIE = 'canva_return_to'

const OAUTH_COOKIE_MAX_AGE = 60 * 10

function oauthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: OAUTH_COOKIE_MAX_AGE,
    path: '/',
  }
}

export async function setCanvaOAuthSession({
  state,
  codeVerifier,
  userId,
  returnTo,
}: {
  state: string
  codeVerifier: string
  userId: string
  returnTo: string
}) {
  const cookieStore = await cookies()
  const options = oauthCookieOptions()

  cookieStore.set(CANVA_OAUTH_STATE_COOKIE, state, options)
  cookieStore.set(CANVA_CODE_VERIFIER_COOKIE, codeVerifier, options)
  cookieStore.set(CANVA_USER_ID_COOKIE, userId, options)
  cookieStore.set(CANVA_RETURN_TO_COOKIE, returnTo, options)
}

export async function readCanvaOAuthSession() {
  const cookieStore = await cookies()

  return {
    state: cookieStore.get(CANVA_OAUTH_STATE_COOKIE)?.value,
    codeVerifier: cookieStore.get(CANVA_CODE_VERIFIER_COOKIE)?.value,
    userId: cookieStore.get(CANVA_USER_ID_COOKIE)?.value,
    returnTo: cookieStore.get(CANVA_RETURN_TO_COOKIE)?.value,
  }
}

export async function clearCanvaOAuthSession() {
  const cookieStore = await cookies()
  const expired = { maxAge: 0, path: '/' }

  cookieStore.set(CANVA_OAUTH_STATE_COOKIE, '', expired)
  cookieStore.set(CANVA_CODE_VERIFIER_COOKIE, '', expired)
  cookieStore.set(CANVA_USER_ID_COOKIE, '', expired)
  cookieStore.set(CANVA_RETURN_TO_COOKIE, '', expired)
}
