import { walletHttpErrorMessage } from '@/profile-app/lib/walletErrors'
import { baseUrl } from '@/redux/api/publicApi'

/**
 * Resolves the backend Google Wallet endpoint for a profile, e.g.
 * `{{vBizme}}/profiles/zohaib-ullah-baig/google-wallet`.
 *
 * Returns null for previews / missing slugs so callers can no-op gracefully.
 */
export function resolveGoogleWalletUrl(slug?: string): string | null {
  const trimmed = slug?.trim()
  if (!trimmed || trimmed === 'preview') return null
  return `${baseUrl}/profiles/${encodeURIComponent(trimmed)}/google-wallet`
}

type GoogleWalletResponse = {
  success?: boolean
  wallet_url?: string
  message?: string
  error?: string
}

/**
 * Calls the backend Google Wallet endpoint and returns the `wallet_url`
 * (a `https://pay.google.com/gp/v/save/...` link) to redirect the user to.
 */
export async function fetchGoogleWalletSaveUrl(slug?: string): Promise<string> {
  const endpoint = resolveGoogleWalletUrl(slug)
  if (!endpoint) throw new Error('Google Wallet is unavailable for this profile.')

  const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } })
  let payload: GoogleWalletResponse = {}
  try {
    payload = (await response.json()) as GoogleWalletResponse
  } catch {
    /* ignore parse errors */
  }

  const walletUrl = payload.wallet_url || (payload as { data?: { wallet_url?: string } }).data?.wallet_url

  if (!response.ok || !walletUrl) {
    throw new Error(walletHttpErrorMessage(response.status, payload, 'Google Wallet'))
  }

  return walletUrl
}

/**
 * Fetches the Google Wallet pass URL and opens it in a new browser tab.
 * Never navigates the current tab.
 */
export async function openGoogleWalletInNewTab(slug?: string): Promise<void> {
  const { notify } = await import('@/lib/toast/toast')

  if (!resolveGoogleWalletUrl(slug)) {
    notify.info('Google Wallet is unavailable in preview.')
    return
  }

  // Open the tab synchronously (within the click gesture) so it isn't popup-blocked.
  // NOTE: do not pass `noopener` here — it makes window.open() return null, leaving
  // a blank tab we can never navigate. We sever the opener manually after navigating.
  const walletTab = window.open('about:blank', '_blank')
  notify.info('Generating your Google Wallet pass…')

  try {
    const walletUrl = await fetchGoogleWalletSaveUrl(slug)
    if (walletTab && !walletTab.closed) {
      walletTab.opener = null
      walletTab.location.href = walletUrl
    } else {
      // Tab was blocked or closed — fall back to a fresh tab.
      window.open(walletUrl, '_blank', 'noopener,noreferrer')
    }
    notify.success('Opening Google Wallet…')
  } catch (error) {
    walletTab?.close()
    notify.error(error instanceof Error ? error.message : 'Could not open Google Wallet.')
  }
}
