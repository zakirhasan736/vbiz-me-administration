export const VBIZME_LOGIN_URL = 'https://app.vbizme.com/login'
export const VBIZME_HOME_URL = 'https://www.vbizme.com/'
export const VBIZME_PRICING_URL = 'https://www.vbizme.com/pricing'
export const VBIZME_CRM_PATH = '/crm'
export const VBIZME_CRM_URL = 'https://app.vbizme.com/crm'

export function openExternalInNewTab(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** Absolute app.vbizme.com URL, or same-origin path when already on the app host. */
export function resolveAppWorkspaceUrl(path: string): string {
  const cleaned = path.startsWith('/') ? path : `/${path}`
  if (typeof window === 'undefined') return `https://app.vbizme.com${cleaned}`
  const host = window.location.hostname
  if (host === 'app.vbizme.com' || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
    return cleaned
  }
  return `https://app.vbizme.com${cleaned}`
}

export function openVbizmeLogin(redirectPath?: string): void {
  const redirect = redirectPath?.trim()
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    openExternalInNewTab(`${VBIZME_LOGIN_URL}?redirect=${encodeURIComponent(redirect)}`)
    return
  }
  openExternalInNewTab(VBIZME_LOGIN_URL)
}

export function openVbizmeHome(): void {
  openExternalInNewTab(VBIZME_HOME_URL)
}

export function openVbizmePricing(): void {
  openExternalInNewTab(VBIZME_PRICING_URL)
}

/**
 * Open CRM in the same tab so unauthenticated owners hit /crm → login → back to /crm.
 * Already signed-in users land on CRM immediately.
 */
export function openVbizmeCrm(): void {
  window.location.assign(resolveAppWorkspaceUrl(VBIZME_CRM_PATH))
}

export function reloadProfileCard(): void {
  window.location.reload()
}
