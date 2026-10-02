export type PushDisplayInput = {
  type?: string
  slug?: string
  profileId?: string | null
  hasFocusedClient: boolean
  now?: number
}

export type PushDisplayPlan = {
  tag: string
  silent: boolean
  requireInteraction: boolean
  /** Safari on iPhone and Mac rejects `image`, `renotify`, and `actions`. */
  omitRichOptionsOnFailure: true
}

const OPERATIONAL_TYPES = new Set(['meeting_alert', 'viewer_return', 'save_contact'])

export function isOperationalPushDisplay(type?: string) {
  return Boolean(type && OPERATIONAL_TYPES.has(type))
}

/** How the service worker should present a push on Windows, Mac, iPhone, and Android. */
export function planPushDisplay(input: PushDisplayInput): PushDisplayPlan {
  const operational = isOperationalPushDisplay(input.type)
  const stamp = input.now ?? Date.now()
  const tag = operational
    ? `vbiz-${input.type}-${input.profileId || input.slug || 'card'}-${stamp}`
    : input.slug
      ? `vbiz-card-${input.slug}`
      : 'vbiz-card-update'

  return {
    tag,
    silent: operational ? false : input.hasFocusedClient,
    requireInteraction: operational,
    omitRichOptionsOnFailure: true,
  }
}
