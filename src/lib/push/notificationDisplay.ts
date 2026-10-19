export type PushDisplayInput = {
  type?: string
  slug?: string
  profileId?: string | null
  /** Kept for callers; focused tabs no longer mute OS push after Allow. */
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
  void input.hasFocusedClient
  const operational = isOperationalPushDisplay(input.type)
  const stamp = input.now ?? Date.now()
  const tag = operational
    ? `vbiz-${input.type}-${input.profileId || input.slug || 'card'}-${stamp}`
    : input.slug
      ? `vbiz-card-${input.slug}`
      : 'vbiz-card-update'

  return {
    tag,
    // Always show the OS push after Allow — even if backoffice or the card tab is open/focused.
    // In-app toast can still fire via SW postMessage; silent must not hide responsible alerts.
    silent: false,
    requireInteraction: operational,
    omitRichOptionsOnFailure: true,
  }
}
