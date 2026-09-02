/** Profile `Setting` key for the per-card Live Agent toggle. */
export const AI_ASSISTANCE_SETTING_KEY = 'aiAssistance_checkbox'

/** Paid add-on price shown when the package does not include AI Assistance. */
export const AI_ASSISTANCE_ADDON_PRICE_USD = 10

export const AI_ASSISTANCE_LOCKED_TITLE = 'Start AI Assistance'

export function aiAssistanceLockedMessage(priceUsd = AI_ASSISTANCE_ADDON_PRICE_USD): string {
  return `AI Assistance is a premium add-on for $${priceUsd} / month. After you pay, it unlocks on your account and this card can turn it on automatically.`
}

/**
 * Public card slugs that ship with guest AI Assistance already active.
 * Everyone else must unlock the package add-on, then enable it in Settings.
 */
export const AI_ASSISTANCE_DEFAULT_ENABLED_SLUGS = ['michaelangelo-casanova-2'] as const

export function normalizeCardSlug(slug?: string | null): string {
  return String(slug || '')
    .trim()
    .toLowerCase()
}

export function isAiAssistanceDefaultEnabledSlug(slug?: string | null): boolean {
  const normalized = normalizeCardSlug(slug)
  return (AI_ASSISTANCE_DEFAULT_ENABLED_SLUGS as readonly string[]).includes(normalized)
}

/**
 * Guest-facing AI Assistance is off unless explicitly enabled on the card,
 * or the card is in the default-enabled slug allowlist.
 */
export function isAiAssistanceEnabled(flag?: boolean | string | number | null, slug?: string | null): boolean {
  if (isAiAssistanceDefaultEnabledSlug(slug)) return true
  if (flag === true || flag === 1) return true
  if (typeof flag === 'string') {
    const trimmed = flag.trim().toLowerCase()
    return trimmed === '1' || trimmed === 'true'
  }
  return false
}
