/** Profile `Setting` key for the per-card Live Agent toggle. */
export const AI_ASSISTANCE_SETTING_KEY = 'aiAssistance_checkbox'

/**
 * Guest-facing AI Assistance is off unless explicitly enabled on the card.
 * Later: AND with the subscribed package feature.
 */
export function isAiAssistanceEnabled(flag?: boolean | string | number | null): boolean {
  if (flag === true || flag === 1) return true
  if (typeof flag === 'string') {
    const trimmed = flag.trim().toLowerCase()
    return trimmed === '1' || trimmed === 'true'
  }
  return false
}
