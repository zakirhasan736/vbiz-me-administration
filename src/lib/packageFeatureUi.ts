import { CARD_LIMIT_FEATURE_KEY } from '@/lib/packageAccess'

export type FeatureRow = { featureKey: string; featureValue: string | null }

const FALSY = new Set(['0', 'false', 'no', 'off', 'disabled'])
const TRUTHY = new Set(['1', 'true', 'yes', 'on', 'enabled'])

export function humanizeFeatureLabel(key: string) {
  const trimmed = key.trim()
  if (!trimmed) return ''
  if (!/[_-]/.test(trimmed) && /[A-Z]/.test(trimmed[0])) return trimmed
  if (!/[_-]/.test(trimmed)) return trimmed
  const words = trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => {
      const lower = w.toLowerCase()
      if (lower === '2d') return '2D'
      if (lower === 'yt') return 'YouTube'
      if (lower === 'bg') return 'background'
      if (lower === 'mb') return 'MB'
      return lower
    })
  if (words.length === 0) return trimmed
  const first = words[0]
  return [first.charAt(0).toUpperCase() + first.slice(1), ...words.slice(1)].join(' ')
}

export function isBooleanPackageFeature(key: string) {
  return key.trim().toLowerCase().startsWith('allow_')
}

export function overridablePackageFeatures(features: FeatureRow[] | undefined | null): FeatureRow[] {
  const seen = new Set<string>()
  const rows: FeatureRow[] = []
  for (const row of features || []) {
    const featureKey = row.featureKey.trim().toLowerCase()
    if (!featureKey || featureKey === CARD_LIMIT_FEATURE_KEY || seen.has(featureKey)) continue
    seen.add(featureKey)
    rows.push({ featureKey, featureValue: row.featureValue ?? null })
  }
  return rows.sort((a, b) => a.featureKey.localeCompare(b.featureKey))
}

export function formatGlobalFeatureDefault(row: FeatureRow): string {
  const raw = (row.featureValue ?? '').trim()
  if (!raw) return 'Not set (inherit as allowed / unlimited)'
  if (raw.toLowerCase() === 'unlimited' || raw === '-1') return 'Unlimited'
  if (isBooleanPackageFeature(row.featureKey)) {
    const lower = raw.toLowerCase()
    if (FALSY.has(lower)) return 'No'
    if (TRUTHY.has(lower)) return 'Yes'
  }
  if (row.featureKey.toLowerCase().includes('file_size')) return `${raw} MB`
  return raw
}

export function compactFeatureOverrides(rows: FeatureRow[] | undefined | null): FeatureRow[] {
  return (rows || []).filter((row) => {
    const key = row.featureKey.trim()
    const value = row.featureValue == null ? '' : String(row.featureValue).trim()
    return Boolean(key) && Boolean(value) && value.toLowerCase() !== 'inherit'
  })
}

export function overrideValue(overrides: FeatureRow[] | undefined, key: string): string | null {
  const found = overrides?.find((row) => row.featureKey.trim().toLowerCase() === key.trim().toLowerCase())
  const value = found?.featureValue
  if (value == null || String(value).trim() === '') return null
  return String(value)
}

export function setOverride(
  overrides: FeatureRow[] | undefined,
  key: string,
  featureValue: string | null
): FeatureRow[] {
  const rest = (overrides || []).filter((row) => row.featureKey.trim().toLowerCase() !== key.trim().toLowerCase())
  if (featureValue == null || featureValue.trim() === '' || featureValue.trim().toLowerCase() === 'inherit') {
    return rest
  }
  return [...rest, { featureKey: key.trim().toLowerCase(), featureValue: featureValue.trim() }]
}
