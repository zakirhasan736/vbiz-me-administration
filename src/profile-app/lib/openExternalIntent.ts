/** Event name for the tap-to-open fallback when browsers block async tel/mailto/sms/http opens. */
export const VBIZ_EXTERNAL_INTENT_EVENT = 'vbiz_external_intent'

export type ExternalIntentDetail = {
  href: string
  label: string
  description?: string
  kind: 'call' | 'email' | 'sms' | 'link'
}

const MAILTO_MAX_LENGTH = 1600
const SMS_BODY_MAX = 400

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function detectKind(href: string): ExternalIntentDetail['kind'] {
  if (href.startsWith('tel:')) return 'call'
  if (href.startsWith('mailto:')) return 'email'
  if (href.startsWith('sms:')) return 'sms'
  return 'link'
}

/**
 * Hard-open tel / mailto / sms / https from AI tool callbacks.
 * Native schemes use a single top-level navigation (location.href).
 * A fallback confirm UI is always armed because browsers often block
 * async opens that are not tied to a real user tap.
 */
export function openExternalIntent(href: string, label: string, description?: string): void {
  if (typeof window === 'undefined' || !href) return

  const kind = detectKind(href)

  // Arm fallback UI immediately (same tick) so a tap is always available.
  window.dispatchEvent(
    new CustomEvent<ExternalIntentDetail>(VBIZ_EXTERNAL_INTENT_EVENT, {
      detail: { href, label, description, kind },
    })
  )

  if (/^https?:/i.test(href)) {
    const opened = window.open(href, '_blank', 'noopener,noreferrer')
    if (!opened) {
      // Popup blocked — fallback banner handles it.
    }
    return
  }

  // Native apps: ONE navigation only. Do not also synthetic-click an <a>,
  // or the OS may show "choose an app" twice / fail SMS entirely.
  try {
    window.location.href = href
  } catch {
    try {
      window.location.assign(href)
    } catch {
      /* fallback UI remains */
    }
  }
}

export function toTelHref(phone: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/[^\d+]/g, '')
  if (!digits) return null
  return `tel:${digits}`
}

export function toSmsHref(phone: string, body?: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/[^\d+]/g, '')
  if (!digits) return null

  const text = body?.trim()
  if (!text) return `sms:${digits}`

  const encoded = encodeURIComponent(text.slice(0, SMS_BODY_MAX))
  // iOS: sms:NUMBER&body=…   Android: sms:NUMBER?body=…
  if (isIosDevice()) {
    return `sms:${digits}&body=${encoded}`
  }
  return `sms:${digits}?body=${encoded}`
}

function normalizeEmailPlainText(text: string): string {
  return text
    .replace(/\+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function toMailtoHref(email: string, subject?: string, body?: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return null

  const subjectText = subject?.trim() || ''
  const bodyText = body?.trim() ? normalizeEmailPlainText(body) : ''

  const build = (subjectValue: string, bodyValue: string) => {
    const queryParts: string[] = []
    if (subjectValue) queryParts.push(`subject=${encodeURIComponent(subjectValue)}`)
    if (bodyValue) queryParts.push(`body=${encodeURIComponent(bodyValue)}`)
    const query = queryParts.join('&')
    return query ? `mailto:${trimmed}?${query}` : `mailto:${trimmed}`
  }

  let href = build(subjectText, bodyText)

  // Oversized mailto URLs often fail silently on mobile — shrink and copy full text.
  if (href.length > MAILTO_MAX_LENGTH && bodyText) {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(bodyText).catch(() => undefined)
    }
    const shortBody =
      bodyText.slice(0, 350).trimEnd() + '\n\n—(Full message copied to clipboard. Paste into this email.)'
    href = build(subjectText, shortBody)
  }

  if (href.length > MAILTO_MAX_LENGTH) {
    // Last resort: subject only so the mail app still opens.
    href = build(subjectText || 'Message from vBiz Me card', '')
  }

  return href
}
