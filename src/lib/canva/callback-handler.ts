import { exchangeAuthorizationCode } from '@/lib/canva/client'
import { clearCanvaOAuthSession, readCanvaOAuthSession } from '@/lib/canva/session'
import { saveCanvaTokens } from '@/lib/canva/token-store'
import { buildCanvaResultUrl } from '@/lib/canva/utils'

type CanvaCallbackSearchParams = {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

export async function handleCanvaOAuthCallback(searchParams: CanvaCallbackSearchParams) {
  const { code, state, error: oauthError, error_description: oauthErrorDescription } = searchParams
  const session = await readCanvaOAuthSession()
  const returnTo = session.returnTo || '/'

  if (oauthError) {
    await clearCanvaOAuthSession()
    return buildCanvaResultUrl(returnTo, 'error', oauthErrorDescription || oauthError)
  }

  if (!code || !state) {
    await clearCanvaOAuthSession()
    return buildCanvaResultUrl(returnTo, 'error', 'missing_code')
  }

  if (!session.state || state !== session.state) {
    await clearCanvaOAuthSession()
    return buildCanvaResultUrl(returnTo, 'error', 'invalid_state')
  }

  if (!session.codeVerifier || !session.userId) {
    await clearCanvaOAuthSession()
    return buildCanvaResultUrl(returnTo, 'error', 'invalid_session')
  }

  try {
    const tokenResponse = await exchangeAuthorizationCode({
      code,
      codeVerifier: session.codeVerifier,
    })

    await saveCanvaTokens(session.userId, tokenResponse)
    await clearCanvaOAuthSession()

    return buildCanvaResultUrl(returnTo, 'connected')
  } catch (error) {
    await clearCanvaOAuthSession()
    const message = error instanceof Error ? error.message : 'token_exchange_failed'
    return buildCanvaResultUrl(returnTo, 'error', message)
  }
}
