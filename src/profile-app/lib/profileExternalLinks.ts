export const VBIZME_LOGIN_URL = 'https://app.vbizme.com/login'
export const VBIZME_HOME_URL = 'https://www.vbizme.com/'
export const VBIZME_PRICING_URL = 'https://www.vbizme.com/pricing'

export function openExternalInNewTab(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function openVbizmeLogin(): void {
  openExternalInNewTab(VBIZME_LOGIN_URL)
}

export function openVbizmeHome(): void {
  openExternalInNewTab(VBIZME_HOME_URL)
}

export function openVbizmePricing(): void {
  openExternalInNewTab(VBIZME_PRICING_URL)
}

export function reloadProfileCard(): void {
  window.location.reload()
}
