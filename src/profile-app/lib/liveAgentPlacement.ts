/**
 * Public-card AI Assistance (Live Agent) placement.
 * Matches vbiz-me-vcard-template-services: fixed FAB on the right,
 * vertically centered on mobile, bottom-right on desktop. Not part of
 * My Info / Call / Email or the bottom tab dock.
 */
export const LIVE_AGENT_PUBLIC_PLACEMENT =
  'top-1/2 right-3 -translate-y-1/2 md:top-auto md:right-6 md:bottom-6 md:translate-y-0 lg:right-10 lg:bottom-10'

/** V2 lifts the desktop FAB above the bottom chrome (same as template-services v2). */
export const LIVE_AGENT_V2_PUBLIC_PLACEMENT =
  'right-3 top-1/2 -translate-y-1/2 md:right-6 md:top-auto md:bottom-[60px] md:translate-y-0 lg:right-10 lg:bottom-[60px]'

/** Editor phone-shell portal: pin to the phone frame, not scrolling card content. */
export const LIVE_AGENT_PREVIEW_PORTAL_CLASS =
  'vbiz-preview-live-agent pointer-events-none absolute right-3 bottom-3 z-110 flex flex-col items-end'

/** Inside the preview portal the FAB is already placed; do not re-apply viewport offsets. */
export const LIVE_AGENT_EMBEDDED_INNER_CLASS = 'relative right-0 bottom-0 top-auto translate-y-0'
