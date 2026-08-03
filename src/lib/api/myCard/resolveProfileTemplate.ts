import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type { MyCardData } from '@interfaces/api/myCard'

const CHECKBOX_ON = new Set(['1', 'true'])

/** Fallback when the home API does not specify a template (backend default). */
export const DEFAULT_PROFILE_TEMPLATE: ProfileTemplateId = 'v3'

/**
 * Canonical `template` values the backend should send on `GET /v/{slug}`.
 * One string per shell — this is the agreed contract with the backend.
 */
export const TEMPLATE_NAME_BY_VERSION: Record<ProfileTemplateId, string> = {
  v1: 'dynamic',
  v2: 'classic',
  v3: 'default',
}

const TEMPLATE_ALIASES: Record<string, ProfileTemplateId> = {
  // v1 — dynamic / first template
  dynamic: 'v1',
  v1: 'v1',
  '1': 'v1',
  first: 'v1',
  'first-template': 'v1',
  first_template: 'v1',

  // v2 — classic / link-in-bio
  classic: 'v2',
  v2: 'v2',
  '2': 'v2',
  second: 'v2',
  'second-template': 'v2',
  second_template: 'v2',
  link: 'v2',
  'link-in-bio': 'v2',

  // v3 — default / redesign
  default: 'v3',
  v3: 'v3',
  '3': 'v3',
  redesign: 'v3',
  third: 'v3',
  'vbiz-profile-redesign': 'v3',
}

function isTruthyFeature(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (value == null) return false
  return CHECKBOX_ON.has(String(value).toLowerCase())
}

/**
 * Resolve the public profile shell from `GET /v/{slug}`.
 *
 * Priority:
 * 1. `template` string — "dynamic" (v1), "classic" (v2), "default" (v3)
 * 2. legacy feature flags `dynamic_template` / `default_template`
 * 3. backend default → v3
 */
export function resolveProfileTemplateFromMyCard(card: MyCardData): ProfileTemplateId {
  const normalized = card.template?.trim().toLowerCase()
  if (normalized && TEMPLATE_ALIASES[normalized]) {
    return TEMPLATE_ALIASES[normalized]
  }

  const { features } = card
  if (isTruthyFeature(features.classic_template)) return 'v2'
  if (isTruthyFeature(features.dynamic_template)) return 'v1'
  if (isTruthyFeature(features.default_template)) return 'v3'

  return DEFAULT_PROFILE_TEMPLATE
}
