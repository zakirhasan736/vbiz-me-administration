import { setAboutMeDraft } from '@/lib/aboutMeDraft'
import { mapBlueprintToVCardData, type CardBlueprint } from '@/lib/ai/cardBlueprint'
import { normalizeCardSeoPayload } from '@/lib/seo/cardSeo'
import { syncMyInfoFromPersonal } from '@/lib/vcardMyInfo'
import { normalizeServiceType } from '@/lib/vcardServices'
import type {
  VCardData,
  VCardFaqEntry,
  VCardGeneralPost,
  VCardPortfolioEntry,
  VCardReviewEntry,
  VCardServiceEntry,
} from '@/types/vcard'

export type AnalyzeResponse = {
  blueprint: CardBlueprint
  draft?: VCardData
  enabledNavIds?: string[]
  recommendedTabs?: CardBlueprint['recommendedTabs']
  optionalFeatures?: CardBlueprint['optionalFeatures']
  businessSummary?: string
  sessionId?: string
  completion?: {
    completionScore: number
    found: string[]
    recommended: string[]
  }
  conflicts?: Array<{ field: string; values: Array<{ value: string; source?: string }> }>
  warnings?: string[]
  missingInformation?: string[]
}

export type SectionFillPayload = Record<string, unknown>

export const MAX_AI_SECTION_ITEMS = 5

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Map fill-section services payload → editor entries (type/title/description/url). */
export function mapServicesFromPayload(payload: SectionFillPayload): VCardServiceEntry[] {
  if (!Array.isArray(payload.services)) return []
  const out: VCardServiceEntry[] = []
  for (const row of payload.services) {
    const s = row as { type?: string; title?: string; description?: string; url?: string }
    const title = String(s.title || '').trim()
    const description = String(s.description || '').trim()
    if (!title && !description) continue
    out.push({
      id: uid('svc'),
      type: normalizeServiceType(s.type),
      title: title || 'Service',
      description,
      url: String(s.url || '').trim(),
      featuredImage: '',
      active: true,
    })
  }
  return out
}

/** Map fill-section portfolio payload → editor entries. */
export function mapPortfolioFromPayload(payload: SectionFillPayload): VCardPortfolioEntry[] {
  if (!Array.isArray(payload.portfolio)) return []
  const out: VCardPortfolioEntry[] = []
  for (const row of payload.portfolio) {
    const p = row as { title?: string; description?: string; url?: string }
    const title = String(p.title || '').trim()
    const description = String(p.description || '').trim()
    if (!title && !description) continue
    out.push({
      id: uid('port'),
      type: 'Image',
      title: title || 'Project',
      description,
      imageUrl: '',
      url: String(p.url || '').trim(),
      active: true,
    })
  }
  return out
}

/** Map fill-section reviews payload → editor entries (author/text/rating). */
export function mapReviewsFromPayload(payload: SectionFillPayload): VCardReviewEntry[] {
  if (!Array.isArray(payload.reviews)) return []
  const out: VCardReviewEntry[] = []
  for (const row of payload.reviews) {
    const r = row as {
      author?: string
      text?: string
      rating?: number
      imageUrl?: string
      url?: string
      isSample?: boolean
      label?: string
    }
    if (
      String(r.label || '')
        .toUpperCase()
        .includes('SAMPLE')
    )
      continue
    const author = String(r.author || '').trim()
    const text = String(r.text || '').trim()
    if (!author && !text) continue
    if (`${author} ${text}`.toLowerCase().includes('draft / sample')) continue
    const ratingRaw = typeof r.rating === 'number' ? r.rating : Number(r.rating)
    const rating = Number.isFinite(ratingRaw) ? Math.min(5, Math.max(1, Math.round(ratingRaw))) : 5
    out.push({
      id: uid('rev'),
      author: author || 'Client',
      text,
      rating,
      imageUrl: String(r.imageUrl || '').trim(),
      url: String(r.url || '').trim(),
    })
  }
  return out
}

/** Map fill-section blogs payload → general posts (title/description/category). */
export function mapBlogsFromPayload(payload: SectionFillPayload): VCardGeneralPost[] {
  if (!Array.isArray(payload.blogs)) return []
  const out: VCardGeneralPost[] = []
  for (const row of payload.blogs) {
    const b = row as { title?: string; description?: string; category?: string; url?: string; imageUrl?: string }
    const title = String(b.title || '').trim()
    const description = String(b.description || '').trim()
    if (!title && !description) continue
    out.push({
      id: uid('blog'),
      category: String(b.category || 'News').trim() || 'News',
      title: title || 'Post',
      description,
      customUrl: String(b.url || '').trim(),
      featuredImage: String(b.imageUrl || '').trim(),
      date: new Date().toISOString().slice(0, 10),
      active: true,
    })
  }
  return out
}

/** Map fill-section FAQs payload → editor entries (question/answer). */
export function mapFaqsFromPayload(payload: SectionFillPayload): VCardFaqEntry[] {
  if (!Array.isArray(payload.faqs)) return []
  const out: VCardFaqEntry[] = []
  for (const row of payload.faqs) {
    const f = row as { question?: string; answer?: string; imageUrl?: string; url?: string }
    const question = String(f.question || '').trim()
    const answer = String(f.answer || '').trim()
    if (!question && !answer) continue
    out.push({
      id: uid('faq'),
      question,
      answer,
      featuredImage: String(f.imageUrl || '').trim(),
      url: String(f.url || '').trim(),
      active: true,
    })
  }
  return out
}

/** Count list entries in a fill-section payload for a given section. */
export function countFillPayloadEntries(section: string, payload: SectionFillPayload): number {
  if (section === 'personal') {
    return payload.personal && typeof payload.personal === 'object' ? 1 : 0
  }
  if (section === 'seo') {
    const seo = payload.seo
    if (!seo || typeof seo !== 'object') return 0
    const normalized = normalizeCardSeoPayload(seo)
    return normalized.metaTitle || normalized.metaDescription ? 1 : 0
  }
  if (section === 'services') return mapServicesFromPayload(payload).length
  if (section === 'portfolio') return mapPortfolioFromPayload(payload).length
  if (section === 'reviews') return mapReviewsFromPayload(payload).length
  if (section === 'blogs') return mapBlogsFromPayload(payload).length
  if (section === 'faqs') return mapFaqsFromPayload(payload).length

  const key =
    section === 'skills'
      ? 'skills'
      : section === 'education'
        ? 'education'
        : section === 'experience'
          ? 'experience'
          : null
  if (!key) return 0
  return Array.isArray(payload[key]) ? (payload[key] as unknown[]).length : 0
}

/** Merge a fill-section payload into an existing draft. */
export function mergeSectionPayload(draft: VCardData, section: string, payload: SectionFillPayload): VCardData {
  const next: VCardData = { ...draft }

  if (section === 'seo' && payload.seo && typeof payload.seo === 'object') {
    next.seo = normalizeCardSeoPayload(payload.seo)
  }

  if (section === 'personal' && payload.personal && typeof payload.personal === 'object') {
    const p = payload.personal as Record<string, string>
    next.personal = {
      ...next.personal,
      fullName: p.fullName || next.personal.fullName,
      email: p.email || next.personal.email,
      dob: p.dob || next.personal.dob,
      phone: p.phone || next.personal.phone,
      designation: p.designation || next.personal.designation,
      company: p.company || next.personal.company,
      about: p.about || next.personal.about,
      website: p.website || next.personal.website,
      address: p.address || next.personal.address,
      city: p.city || next.personal.city,
      state: p.state || next.personal.state,
      zipCode: p.zipCode || next.personal.zipCode,
    }
    const aboutText = String(p.about || '').trim()
    if (aboutText) {
      // About Me section is the public source of truth; keep personal.about for Home tagline.
      setAboutMeDraft({
        descriptionHtml: aboutText.includes('<') ? aboutText : `<p>${aboutText}</p>`,
      })
    }
    const handles = (payload.socialHandles || {}) as Record<string, string>
    next.social = {
      handles: { ...(next.social?.handles || {}), ...handles },
      customLinks: next.social?.customLinks || [],
      games: next.social?.games || {},
    }
  }

  if (section === 'services') {
    const mapped = mapServicesFromPayload(payload)
    if (mapped.length) next.services = [...(next.services || []), ...mapped]
  }

  if (section === 'blogs') {
    const mapped = mapBlogsFromPayload(payload)
    if (mapped.length) {
      const seen = new Set<string>()
      next.generalPosts = [...(next.generalPosts || []), ...mapped].filter((item) => {
        const key = `${item.title.trim().toLowerCase()}|${item.description.trim().toLowerCase()}`
        if (!key.replace('|', '') || seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
  }

  if (section === 'portfolio') {
    const mapped = mapPortfolioFromPayload(payload)
    if (mapped.length) next.portfolio = [...(next.portfolio || []), ...mapped]
  }

  if (section === 'reviews') {
    const mapped = mapReviewsFromPayload(payload)
    if (mapped.length) {
      const seen = new Set<string>()
      next.reviews = [...(next.reviews || []), ...mapped].filter((item) => {
        const key = `${item.author.trim().toLowerCase()}|${item.text.trim().toLowerCase()}`
        if (!key.replace('|', '') || seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
  }

  if (section === 'skills' && Array.isArray(payload.skills)) {
    const seen = new Set<string>()
    let remaining = MAX_AI_SECTION_ITEMS
    next.skills = [...(next.skills || []), ...payload.skills].flatMap((raw) => {
      if (remaining <= 0) return []
      const s = raw as { id?: string; type?: string; skills?: string[] }
      const skills = (Array.isArray(s.skills) ? s.skills : [])
        .map((skill) => String(skill || '').trim())
        .filter((skill) => {
          const key = skill.toLowerCase()
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, remaining)
      remaining -= skills.length
      return skills.length
        ? [{ id: s.id || uid('skill'), type: String(s.type || 'General').trim() || 'General', skills }]
        : []
    })
  }

  if (section === 'education' && Array.isArray(payload.education)) {
    next.education = [
      ...(next.education || []),
      ...payload.education.map(
        (e: { institute?: string; degree?: string; fromDate?: string; toDate?: string; tillNow?: boolean }) => ({
          id: uid('edu'),
          institute: e.institute || '',
          degree: e.degree || '',
          fromDate: e.fromDate || '',
          toDate: e.toDate || '',
          tillNow: Boolean(e.tillNow),
        })
      ),
    ]
  }

  if (section === 'experience' && Array.isArray(payload.experience)) {
    next.experience = [
      ...(next.experience || []),
      ...payload.experience.map(
        (e: {
          company?: string
          jobTitle?: string
          description?: string
          fromDate?: string
          toDate?: string
          tillNow?: boolean
        }) => ({
          id: uid('exp'),
          company: e.company || '',
          jobTitle: e.jobTitle || '',
          description: e.description || '',
          fromDate: e.fromDate || '',
          toDate: e.toDate || '',
          tillNow: Boolean(e.tillNow),
        })
      ),
    ]
  }

  if (section === 'faqs') {
    const generated = mapFaqsFromPayload(payload)
    const seen = new Set<string>()
    next.faqs = [...(next.faqs || []), ...generated].filter((item) => {
      const key = `${item.question.trim().toLowerCase()}|${item.answer.trim().toLowerCase()}`
      if (!key.replace('|', '') || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  return syncMyInfoFromPersonal(next)
}

export function preferExistingPersonal(base: VCardData | undefined, next: VCardData): VCardData {
  if (!base?.personal) return next
  const keys: Array<keyof VCardData['personal']> = [
    'fullName',
    'email',
    'phone',
    'dob',
    'company',
    'website',
    'address',
    'designation',
    'about',
    'whatsapp',
  ]
  const personal = { ...next.personal }
  for (const key of keys) {
    const existing = String(base.personal[key] || '').trim()
    if (existing) personal[key] = existing as never
  }
  const slug = String(base.slug || '').trim() || next.slug
  return syncMyInfoFromPersonal({ ...next, slug, personal })
}

function mergeSourcedDraftList<T>(
  existing: T[] | undefined,
  incoming: T[] | undefined,
  keyOf: (item: T) => string
): T[] {
  const base = Array.isArray(existing) ? existing : []
  const add = Array.isArray(incoming) ? incoming : []
  const seen = new Set(base.map(keyOf).filter(Boolean))
  const out = [...base]
  for (const item of add) {
    const key = keyOf(item)
    if (key && seen.has(key)) continue
    if (key) seen.add(key)
    out.push(item)
  }
  return out
}

function mergeListSections(base: VCardData | undefined, next: VCardData): VCardData {
  if (!base) return next
  return {
    ...next,
    faqs: mergeSourcedDraftList(base.faqs, next.faqs, (item) => `${item.question}|${item.answer}`.trim().toLowerCase()),
    generalPosts: mergeSourcedDraftList(base.generalPosts, next.generalPosts, (item) =>
      `${item.title}|${item.description}`.trim().toLowerCase()
    ),
    reviews: mergeSourcedDraftList(base.reviews, next.reviews, (item) =>
      `${item.author}|${item.text}`.trim().toLowerCase()
    ),
  }
}

export function applyAnalyzeToDraft(response: AnalyzeResponse, base?: VCardData) {
  if (response.draft && response.enabledNavIds) {
    const data = base ? { ...response.draft, appearance: base.appearance, theme: base.theme } : response.draft
    return {
      data: mergeListSections(base, preferExistingPersonal(base, data)),
      enabledNavIds: response.enabledNavIds,
      recommendedTabs: response.recommendedTabs || [],
      optionalFeatures: response.optionalFeatures || {},
      businessSummary: response.businessSummary || '',
    }
  }
  const mapped = mapBlueprintToVCardData(response.blueprint, base)
  return { ...mapped, data: mergeListSections(base, preferExistingPersonal(base, mapped.data)) }
}

/** Paths to write via updateData for a full draft replace. */
export function draftFieldWrites(data: VCardData): Array<{ path: string; value: unknown }> {
  return [
    { path: 'slug', value: data.slug },
    { path: 'personal', value: data.personal },
    { path: 'social', value: data.social },
    { path: 'education', value: data.education || [] },
    { path: 'experience', value: data.experience || [] },
    { path: 'skills', value: data.skills || [] },
    { path: 'services', value: data.services || [] },
    { path: 'portfolio', value: data.portfolio || [] },
    { path: 'reviews', value: data.reviews || [] },
    { path: 'generalPosts', value: data.generalPosts || [] },
    { path: 'faqs', value: data.faqs || [] },
    { path: 'seo', value: data.seo },
    { path: 'myInfo', value: data.myInfo },
  ]
}
