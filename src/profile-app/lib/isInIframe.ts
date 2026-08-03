/** True when this document is running inside another page's iframe. */
export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false

  try {
    if (window.self !== window.top) return true
  } catch {
    // Cross-origin parent — top is not readable, but we are framed.
    return true
  }

  try {
    return window.frameElement != null
  } catch {
    return false
  }
}

export function markIframeEmbedOnDocument(): void {
  if (typeof document === 'undefined') return
  if (isInIframe()) {
    document.documentElement.dataset.vbizIframeEmbed = ''
  } else {
    delete document.documentElement.dataset.vbizIframeEmbed
  }
}
