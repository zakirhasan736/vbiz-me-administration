import { mapBlueprintToVCardData, type CardBlueprint } from '@/lib/ai/cardBlueprint'
import type { VCardData } from '@/types/vcard'

export type AnalyzeResponse = {
  blueprint: CardBlueprint
  draft?: VCardData
  enabledNavIds?: string[]
  recommendedTabs?: CardBlueprint['recommendedTabs']
  optionalFeatures?: CardBlueprint['optionalFeatures']
  businessSummary?: string
}

export type SectionFillPayload = Record<string, unknown>

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Merge a fill-section payload into an existing draft. */
export function mergeSectionPayload(draft: VCardData, section: string, payload: SectionFillPayload): VCardData {
  const next: VCardData = { ...draft }

  if (section === 'personal' && payload.personal && typeof payload.personal === 'object') {
    const p = payload.personal as Record<string, string>
    next.personal = {
      ...next.personal,
      fullName: p.fullName || next.personal.fullName,
      email: p.email || next.personal.email,
      phone: p.phone || next.personal.phone,
      designation: p.designation || next.personal.designation,
      company: p.company || next.personal.company,
      about: p.about || next.personal.about,
      website: p.website || next.personal.website,
      address: p.address || next.personal.address,
    }
    const handles = (payload.socialHandles || {}) as Record<string, string>
    next.social = {
      handles: { ...(next.social?.handles || {}), ...handles },
      customLinks: next.social?.customLinks || [],
      games: next.social?.games || {},
    }
  }

  if (section === 'services' && Array.isArray(payload.services)) {
    next.services = [
      ...(next.services || []),
      ...payload.services.map((s: { title?: string; description?: string; url?: string }) => ({
        id: uid('svc'),
        type: 'Service',
        title: s.title || 'Service',
        description: s.description || '',
        url: s.url || '',
        featuredImage: '',
        active: true,
      })),
    ]
  }

  if (section === 'blogs' && Array.isArray(payload.blogs)) {
    next.generalPosts = [
      ...(next.generalPosts || []),
      ...payload.blogs.map((b: { title?: string; description?: string; category?: string }) => ({
        id: uid('blog'),
        category: b.category || 'News',
        title: b.title || 'Post',
        description: b.description || '',
        customUrl: '',
        featuredImage: '',
        date: new Date().toISOString().slice(0, 10),
        active: true,
      })),
    ]
  }

  if (section === 'portfolio' && Array.isArray(payload.portfolio)) {
    next.portfolio = [
      ...(next.portfolio || []),
      ...payload.portfolio.map((p: { title?: string; description?: string; url?: string }) => ({
        id: uid('port'),
        type: 'Image',
        title: p.title || 'Project',
        description: p.description || '',
        imageUrl: '',
        url: p.url || '',
        active: true,
      })),
    ]
  }

  if (section === 'reviews' && Array.isArray(payload.reviews)) {
    next.reviews = [
      ...(next.reviews || []),
      ...payload.reviews.map((r: { author?: string; text?: string; rating?: number }) => ({
        id: uid('rev'),
        author: r.author || 'Client',
        text: r.text || '',
        rating: Math.min(5, Math.max(1, Math.round(r.rating || 5))),
      })),
    ]
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
  ]
}
