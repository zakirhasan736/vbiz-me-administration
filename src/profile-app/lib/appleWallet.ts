import { notify } from '@/lib/toast/toast'
import { walletHttpErrorMessage } from '@/profile-app/lib/walletErrors'
import { baseUrl } from '@/redux/api/publicApi'

export function resolveAppleWalletUrl(slug?: string): string | null {
  const trimmed = slug?.trim()
  if (!trimmed || trimmed === 'preview') return null
  return `${baseUrl}/profiles/${encodeURIComponent(trimmed)}/apple-wallet`
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/** Instagram / Facebook / etc. in-app browsers cannot hand .pkpass to Wallet. */
function isRestrictedInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|Instagram|Line\/|LinkedInApp|Twitter|MicroMessenger|Snapchat|TikTok/i.test(ua)
}

/**
 * Opens the signed .pkpass for Apple Wallet.
 *
 * iPhone/Safari: navigate straight to the API URL in the same tap (no about:blank,
 * no await before navigation). Safari hands the Content-Type to Wallet → Add Pass.
 * Desktop: download the .pkpass file.
 */
export async function downloadAppleWalletPass(slug?: string): Promise<void> {
  const endpoint = resolveAppleWalletUrl(slug)
  if (!endpoint) {
    notify.info('Apple Wallet is unavailable in preview.')
    return
  }

  if (isRestrictedInAppBrowser()) {
    notify.info('Open this card in Safari, then tap Save to Apple Wallet. In-app browsers cannot add passes.')
    return
  }

  // iOS: must navigate in the same user-gesture turn. Any await before this
  // (toast dynamic import, fetch, blank tab) causes a blank page or blocked handoff.
  if (isIosDevice()) {
    notify.info('Opening Apple Wallet…')
    window.location.assign(endpoint)
    return
  }

  notify.info('Generating your Apple Wallet pass…')

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/vnd.apple.pkpass, application/json' },
    })

    if (!response.ok) {
      let payload: { message?: string; error?: string } = {}
      try {
        payload = (await response.json()) as { message?: string; error?: string }
      } catch {
        /* ignore */
      }
      throw new Error(walletHttpErrorMessage(response.status, payload, 'Apple Wallet'))
    }

    const blob = await response.blob()
    const file = new Blob([blob], { type: 'application/vnd.apple.pkpass' })
    const objectUrl = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `${slug?.trim() || 'vbiz-card'}.pkpass`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
    notify.success('Apple Wallet pass downloaded. AirDrop or email the .pkpass to your iPhone, then tap it to add.')
  } catch (error) {
    notify.error(error instanceof Error ? error.message : 'Could not open Apple Wallet.')
  }
}
