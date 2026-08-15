import { baseUrl } from '@/redux/api/publicApi'

export function resolveAppleWalletUrl(slug?: string): string | null {
  const trimmed = slug?.trim()
  if (!trimmed || trimmed === 'preview') return null
  return `${baseUrl}/profiles/${encodeURIComponent(trimmed)}/apple-wallet`
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/**
 * Downloads the signed .pkpass. On iPhone/iPad Safari, opening the API URL
 * lets Wallet show Add Pass. On desktop, the file downloads.
 */
export async function downloadAppleWalletPass(slug?: string): Promise<void> {
  const { notify } = await import('@/lib/toast/toast')
  const endpoint = resolveAppleWalletUrl(slug)
  if (!endpoint) {
    notify.info('Apple Wallet is unavailable in preview.')
    return
  }

  const passTab = window.open('about:blank', '_blank')
  notify.info('Generating your Apple Wallet pass…')

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/vnd.apple.pkpass, application/json' },
    })

    if (!response.ok) {
      let message = 'Could not generate your Apple Wallet pass.'
      try {
        const payload = (await response.json()) as { message?: string; error?: string }
        message = payload.message || payload.error || message
      } catch {
        /* ignore */
      }
      throw new Error(message)
    }

    if (isIosDevice()) {
      if (passTab && !passTab.closed) {
        passTab.opener = null
        passTab.location.href = endpoint
      } else {
        window.location.href = endpoint
      }
      notify.success('Opening Apple Wallet…')
      return
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
    passTab?.close()
    notify.success('Apple Wallet pass downloaded. Open it on iPhone to add.')
  } catch (error) {
    passTab?.close()
    notify.error(error instanceof Error ? error.message : 'Could not open Apple Wallet.')
  }
}
