import { isStaffRole } from '@/constants/userRole'

export const PACKAGE_ACCESS_FEATURES = [
  { key: 'allow_ai_assistance', label: 'AI assistance' },
  { key: 'allow_canva', label: 'Canva feature' },
  { key: 'allow_push_notification', label: 'Push notification' },
  { key: 'allow_email_notification', label: 'Email notification' },
  { key: 'allow_support_ticket', label: 'Contact support ticket' },
  { key: 'allow_auto_card_builder', label: 'Auto card builder' },
  { key: 'allow_seo', label: 'SEO' },
  { key: 'allow_crm', label: 'CRM' },
] as const

export type PackageAccessKey = (typeof PACKAGE_ACCESS_FEATURES)[number]['key']
export type PackageAccessMap = Record<PackageAccessKey, boolean>

export const CARD_LIMIT_FEATURE_KEY = 'max_cards'

export const CORPORATE_LIMIT_OVERRIDE_KEYS = ['max_social_links', 'max_extra_fields', 'max_file_size_mb'] as const

export type CorporateLimitOverrideKey = (typeof CORPORATE_LIMIT_OVERRIDE_KEYS)[number]

export const RETIRED_PACKAGE_SLUGS = ['corporate-starter', 'single-starter'] as const
export const RETIRED_PACKAGE_NAMES = ['corporate starter', 'single starter', 'single card'] as const

export const PACKAGE_FEATURE_LOCKED_MESSAGE =
  'This feature is not included in your package. Ask an administrator to enable it on your plan.'

export const FEATURE_NOT_INCLUDED = 'FEATURE_NOT_INCLUDED'
export const FEATURE_LIMIT_REACHED = 'FEATURE_LIMIT_REACHED'
export const PACKAGE_FEATURE_LOCKED = 'PACKAGE_FEATURE_LOCKED'
export const PACKAGE_LIMIT_REACHED = 'PACKAGE_LIMIT_REACHED'

/** Professional per-file cap (image, video, document). Not a card-wide total. */
export const PROFESSIONAL_UPLOAD_MAX_MB = 50
export const PROFESSIONAL_UPLOAD_MAX_BYTES = PROFESSIONAL_UPLOAD_MAX_MB * 1024 * 1024
/** Transport ceiling for unlimited packages (corporate / professional concierge). */
export const UNLIMITED_UPLOAD_TRANSPORT_MAX_MB = 512
export const UNLIMITED_UPLOAD_TRANSPORT_MAX_BYTES = UNLIMITED_UPLOAD_TRANSPORT_MAX_MB * 1024 * 1024

export type PerFileUploadLimit = {
  maxBytes: number
  maxMb: number
  unlimited: boolean
}

export function resolvePerFileUploadLimit(maxFileSizeMb?: number | null, isStaff = false): PerFileUploadLimit {
  if (isStaff || maxFileSizeMb == null) {
    return {
      maxBytes: UNLIMITED_UPLOAD_TRANSPORT_MAX_BYTES,
      maxMb: UNLIMITED_UPLOAD_TRANSPORT_MAX_MB,
      unlimited: true,
    }
  }
  const maxMb = Math.max(1, Math.round(maxFileSizeMb))
  return { maxBytes: maxMb * 1024 * 1024, maxMb, unlimited: false }
}

export function perFileUploadLimitLabel(limit: PerFileUploadLimit): string {
  return limit.unlimited ? 'No per-file size limit' : `Max ${limit.maxMb}MB per file`
}

export function isFeatureLockCode(code?: string | null) {
  return code === FEATURE_NOT_INCLUDED || code === PACKAGE_FEATURE_LOCKED
}

export function isFeatureLimitCode(code?: string | null) {
  return code === FEATURE_LIMIT_REACHED || code === PACKAGE_LIMIT_REACHED || code === 'CORPORATE_CARD_LIMIT_REACHED'
}

export const PACKAGE_MEDIA_FEATURE_KEYS = [
  'allow_video_upload',
  'allow_2d_explainer',
  'allow_background_video_upload',
  'allow_intro_video_upload',
  'allow_music_upload',
  'allow_bg_music_upload',
  'allow_yt_bg_music_upload',
] as const

export type PackageMediaFeatureKey = (typeof PACKAGE_MEDIA_FEATURE_KEYS)[number]

export function musicFileAllowed(can: (key: string) => boolean) {
  return can('allow_music_upload') && can('allow_bg_music_upload')
}

export function displayMediaAccess(fieldKey: string, can: (key: string) => boolean) {
  const key = fieldKey.trim()
  // Builder media is never package-locked — owners can upload any image/video for these fields.
  void can
  if (key === 'Profile Image/Video') {
    return {
      locked: false,
      allowVideo: true,
      allowAudio: false,
      sourceMode: 'both' as const,
    }
  }
  if (key === 'Background Video/Image') {
    return {
      locked: false,
      allowVideo: true,
      allowAudio: false,
      sourceMode: 'both' as const,
    }
  }
  if (key === 'Intro vCard Video') {
    return { locked: false, allowVideo: true, allowAudio: false, sourceMode: 'video' as const }
  }
  if (key === 'Background Music') {
    const allow = musicFileAllowed(can)
    return { locked: !allow, allowVideo: false, allowAudio: allow, sourceMode: 'image' as const }
  }
  return { locked: false, allowVideo: true, allowAudio: true, sourceMode: 'both' as const }
}

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

export function allPackageAccessDisabled(): PackageAccessMap {
  return Object.fromEntries(PACKAGE_ACCESS_FEATURES.map((item) => [item.key, false])) as PackageAccessMap
}

export function entitlementsFromFeatures(
  features: { featureKey: string; featureValue?: string | null }[] | undefined | null,
  whenMissing = true
): PackageAccessMap {
  const map = whenMissing ? allPackageAccessEnabled() : allPackageAccessDisabled()
  // Premium add-ons: missing flags stay locked unless explicitly enabled.
  map.allow_ai_assistance = false
  map.allow_crm = false
  if (!features?.length) return map
  for (const item of PACKAGE_ACCESS_FEATURES) {
    const row = features.find((feature) => feature.featureKey.trim().toLowerCase() === item.key)
    if (!row) continue
    const defaultWhenMissing = item.key === 'allow_ai_assistance' || item.key === 'allow_crm' ? false : whenMissing
    map[item.key] = parseAccessFlag(row.featureValue, defaultWhenMissing)
  }
  return map
}

export function catalogFeatureAllowed(
  input: {
    access: PackageAccessMap
    features?: { featureKey: string; featureValue?: string | null; unlimited?: boolean }[]
    subscriptionActive?: boolean
    source?: string
  },
  key: string
): boolean {
  const featureKey = key.trim().toLowerCase()
  const unpaidOwner = input.source !== 'staff' && input.subscriptionActive === false
  if (unpaidOwner && featureKey.startsWith('allow_')) return false
  if (isPackageAccessKey(featureKey)) return input.access[featureKey]
  const row = (input.features || []).find((item) => item.featureKey.trim().toLowerCase() === featureKey)
  const whenMissing = input.source === 'staff' || input.subscriptionActive !== false
  if (!featureKey.startsWith('allow_')) return whenMissing
  return parseAccessFlag(row?.featureValue, whenMissing)
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
