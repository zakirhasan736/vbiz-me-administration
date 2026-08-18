import { setAboutMeDraft } from '@/lib/aboutMeDraft'
import { mapBlueprintToVCardData, type CardBlueprint } from '@/lib/ai/cardBlueprint'
import { normalizeCardSeoPayload } from '@/lib/seo/cardSeo'
import { normalizeServiceType } from '@/lib/vcardServices'
import type {
  VCardData,
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
    const r = row as { author?: string; text?: string; rating?: number; isSample?: boolean; label?: string }
    if (r.isSample) continue
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
      imageUrl: '',
      url: '',
    })
  }
  return out
}

/** Map fill-section blogs payload → general posts (title/description/category). */
export function mapBlogsFromPayload(payload: SectionFillPayload): VCardGeneralPost[] {
  if (!Array.isArray(payload.blogs)) return []
  const out: VCardGeneralPost[] = []
  for (const row of payload.blogs) {
    const b = row as { title?: string; description?: string; category?: string }
    const title = String(b.title || '').trim()
    const description = String(b.description || '').trim()
    if (!title && !description) continue
    out.push({
      id: uid('blog'),
      category: String(b.category || 'News').trim() || 'News',
      title: title || 'Post',
      description,
      customUrl: '',
      featuredImage: '',
      date: new Date().toISOString().slice(0, 10),
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

  const key =
    section === 'skills'
      ? 'skills'
      : section === 'education'
        ? 'education'
        : section === 'experience'
          ? 'experience'
          : section === 'faqs'
            ? 'faqs'
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
    if (mapped.length) next.generalPosts = [...(next.generalPosts || []), ...mapped]
  }

  if (section === 'portfolio') {
    const mapped = mapPortfolioFromPayload(payload)
    if (mapped.length) next.portfolio = [...(next.portfolio || []), ...mapped]
  }

  if (section === 'reviews') {
    const mapped = mapReviewsFromPayload(payload)
    if (mapped.length) next.reviews = [...(next.reviews || []), ...mapped]
  }

  if (section === 'skills' && Array.isArray(payload.skills)) {
    next.skills = [
      ...(next.skills || []),
      ...payload.skills.map((s: { type?: string; skills?: string[] }) => ({
        id: uid('skill'),
        type: s.type || 'General',
        skills: Array.isArray(s.skills) ? s.skills.filter(Boolean) : [],
      })),
    ]
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

  if (section === 'faqs' && Array.isArray(payload.faqs)) {
    next.faqs = [
      ...(next.faqs || []),
      ...payload.faqs.map((f: { question?: string; answer?: string }) => ({
        id: uid('faq'),
        question: f.question || '',
        answer: f.answer || '',
        active: true,
      })),
    ]
  }

  return next
}

export function applyAnalyzeToDraft(response: AnalyzeResponse, base?: VCardData) {
  if (response.draft && response.enabledNavIds) {
    return {
      data: base ? { ...response.draft, appearance: base.appearance, theme: base.theme } : response.draft,
      enabledNavIds: response.enabledNavIds,
      recommendedTabs: response.recommendedTabs || [],
      optionalFeatures: response.optionalFeatures || {},
      businessSummary: response.businessSummary || '',
    }
  }
  return mapBlueprintToVCardData(response.blueprint, base)
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
  ]
}
