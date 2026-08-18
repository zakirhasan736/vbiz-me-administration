import type { VCardSeo } from '@/types/vcard'

export const SEO_META_TITLE_SETTING_KEY = 'seo_meta_title'
export const SEO_META_DESCRIPTION_SETTING_KEY = 'seo_meta_description'
export const SEO_META_KEYWORDS_SETTING_KEY = 'seo_meta_keywords_json'
export const MAX_OWNER_SEO_KEYWORDS = 10
export const MAX_SEO_TITLE_LENGTH = 70
export const MAX_SEO_DESCRIPTION_LENGTH = 160

/** Required vBiz Me terms that remain present in every card's keyword set. */
export const SEO_FIXED_KEYWORDS = [
  'vbizme',
  'vbiz me',
  'virtual card',
  'digital business card',
  'online business card',
] as const

/** Stored/public keyword cap: hidden vBiz terms + owner-visible phrases. */
export const MAX_SEO_KEYWORDS = SEO_FIXED_KEYWORDS.length + MAX_OWNER_SEO_KEYWORDS

function cleanKeyword(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

export function isFixedSeoKeyword(value: unknown): boolean {
  const key = cleanKeyword(value).toLowerCase()
  if (!key) return false
  return SEO_FIXED_KEYWORDS.some((item) => item.toLowerCase() === key)
}

function uniqueKeywords(source: unknown[], limit: number): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const keyword of source) {
    const value = cleanKeyword(keyword)
    const key = value.toLowerCase()
    if (!value || seen.has(key)) continue
    seen.add(key)
    result.push(value)
    if (result.length >= limit) break
  }
  return result
}

/** Owner-visible keywords only — vBiz Me terms stay hidden in Card Settings. */
export function ownerSeoKeywords(input: unknown): string[] {
  const source = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',') : []
  return uniqueKeywords(
    source.filter((keyword) => !isFixedSeoKeyword(keyword)),
    MAX_OWNER_SEO_KEYWORDS
  )
}

export function normalizeSeoKeywords(input: unknown): string[] {
  return uniqueKeywords([...SEO_FIXED_KEYWORDS, ...ownerSeoKeywords(input)], MAX_SEO_KEYWORDS)
}

export function normalizeCardSeo(input?: Partial<VCardSeo> | null): VCardSeo {
  return {
    metaTitle: String(input?.metaTitle || '')
      .trim()
      .slice(0, MAX_SEO_TITLE_LENGTH),
    metaDescription: String(input?.metaDescription || '')
      .trim()
      .slice(0, MAX_SEO_DESCRIPTION_LENGTH),
    metaKeywords: normalizeSeoKeywords(input?.metaKeywords),
  }
}

/** Accepts the editor shape and the backend AI fill-section shape. */
export function normalizeCardSeoPayload(input: unknown): VCardSeo {
  if (!input || typeof input !== 'object') return normalizeCardSeo()
  const raw = input as {
    metaTitle?: unknown
    metaDescription?: unknown
    metaKeywords?: unknown
    keywords?: unknown
  }
  const rawKeywords = raw.metaKeywords ?? raw.keywords
  return normalizeCardSeo({
    metaTitle: typeof raw.metaTitle === 'string' ? raw.metaTitle : '',
    metaDescription: typeof raw.metaDescription === 'string' ? raw.metaDescription : '',
    metaKeywords: Array.isArray(rawKeywords)
      ? rawKeywords.filter((value): value is string => typeof value === 'string')
      : [],
  })
}

export function parseSeoSettings(settings: Record<string, string | undefined>): VCardSeo {
  let metaKeywords: unknown = []
  const rawKeywords = settings[SEO_META_KEYWORDS_SETTING_KEY]
  if (rawKeywords) {
    try {
      metaKeywords = JSON.parse(rawKeywords)
    } catch {
      metaKeywords = rawKeywords
    }
  }

  return normalizeCardSeo({
    metaTitle: settings[SEO_META_TITLE_SETTING_KEY],
    metaDescription: settings[SEO_META_DESCRIPTION_SETTING_KEY],
    metaKeywords: Array.isArray(metaKeywords) ? metaKeywords : [],
  })
}

export function seoToApiSettings(seo?: VCardSeo): Record<string, string> {
  const normalized = normalizeCardSeo(seo)
  return {
    [SEO_META_TITLE_SETTING_KEY]: normalized.metaTitle,
    [SEO_META_DESCRIPTION_SETTING_KEY]: normalized.metaDescription,
    [SEO_META_KEYWORDS_SETTING_KEY]: JSON.stringify(normalized.metaKeywords),
  }
}

export function hasSeoContent(seo?: VCardSeo): boolean {
  return Boolean(seo?.metaTitle?.trim() || seo?.metaDescription?.trim())
}
