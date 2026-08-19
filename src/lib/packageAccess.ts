import { isStaffRole } from '@/constants/userRole'

export const PACKAGE_ACCESS_FEATURES = [
  { key: 'allow_ai_assistance', label: 'AI assistance' },
  { key: 'allow_canva', label: 'Canva feature' },
  { key: 'allow_push_notification', label: 'Push notification' },
  { key: 'allow_email_notification', label: 'Email notification' },
  { key: 'allow_support_ticket', label: 'Contact support ticket' },
  { key: 'allow_auto_card_builder', label: 'Auto card builder' },
  { key: 'allow_seo', label: 'SEO' },
] as const

export type PackageAccessKey = (typeof PACKAGE_ACCESS_FEATURES)[number]['key']
export type PackageAccessMap = Record<PackageAccessKey, boolean>

export const RETIRED_PACKAGE_SLUGS = ['corporate-starter', 'single-starter'] as const
export const RETIRED_PACKAGE_NAMES = ['corporate starter', 'single starter', 'single card'] as const

export const PACKAGE_FEATURE_LOCKED_MESSAGE =
  'This feature is not included in your package. Ask an administrator to enable it on your plan.'

const ACCESS_KEY_SET = new Set<string>(PACKAGE_ACCESS_FEATURES.map((item) => item.key))
const TRUTHY = new Set(['1', 'true', 'yes', 'on', 'enabled'])
const FALSY = new Set(['0', 'false', 'no', 'off', 'disabled'])

export function isPackageAccessKey(key: string): key is PackageAccessKey {
  return ACCESS_KEY_SET.has(key.trim().toLowerCase())
}

export function allPackageAccessEnabled(): PackageAccessMap {
  return Object.fromEntries(PACKAGE_ACCESS_FEATURES.map((item) => [item.key, true])) as PackageAccessMap
}

export function parseAccessFlag(value: string | null | undefined, whenMissing = true): boolean {
  if (value == null || String(value).trim() === '') return whenMissing
  const normalized = String(value).trim().toLowerCase()
  if (FALSY.has(normalized)) return false
  if (TRUTHY.has(normalized)) return true
  return whenMissing
}

export function entitlementsFromFeatures(
  features: { featureKey: string; featureValue?: string | null }[] | undefined | null
): PackageAccessMap {
  const map = allPackageAccessEnabled()
  if (!features?.length) return map
  for (const item of PACKAGE_ACCESS_FEATURES) {
    const row = features.find((feature) => feature.featureKey.trim().toLowerCase() === item.key)
    if (row) map[item.key] = parseAccessFlag(row.featureValue, true)
  }
  return map
}

export function isRetiredPackage(pkg: { slug?: string | null; name?: string | null }): boolean {
  const slug = (pkg.slug || '').trim().toLowerCase()
  const name = (pkg.name || '').trim().toLowerCase()
  return (
    RETIRED_PACKAGE_SLUGS.includes(slug as (typeof RETIRED_PACKAGE_SLUGS)[number]) ||
    RETIRED_PACKAGE_NAMES.includes(name as (typeof RETIRED_PACKAGE_NAMES)[number])
  )
}

export function entitlementsForRole(
  role: string | null | undefined,
  features: { featureKey: string; featureValue?: string | null }[] | undefined | null
): PackageAccessMap {
  if (isStaffRole(role)) return allPackageAccessEnabled()
  return entitlementsFromFeatures(features)
}
