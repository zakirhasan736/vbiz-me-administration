import { alignLabelAndBody } from '@/lib/ai/alignPastedFields'
import type { SectionFillPayload } from '@/lib/ai/applyCardDraft'
import { plainTextToRichHtml } from '@/lib/htmlText'
import type { CertItem } from '@/lib/vcardCertificates'
import { createEmptyCert } from '@/lib/vcardCertificates'
import { createDefaultSectionPostItem, type SectionFieldKey } from '@/lib/vcardSectionSchemas'
import type {
  VCardCustomTabItem,
  VCardEducationEntry,
  VCardExperienceEntry,
  VCardSectionPostItem,
  VCardSkillGroup,
} from '@/types/vcard'

/**
 * AI auto-fill for tabs without a dedicated fill section:
 * - "entries": a list (section-post tabs like Events or Menu, Certificates, Custom Tabs)
 * - "content": one heading + body (About Me, Mission Statement, Why Choose Us…)
 * plus uncapped mappers for Education / Experience / Skills pastes.
 */

export type GenericFillEntry = {
  title: string
  subtitle: string
  description: string
  url: string
  imageUrl: string
  date: string
  location: string
  price: string
  offerPrice: string
}

export type GenericFillContent = { title: string; description: string }

/** What the AI should know about the tab it is filling. */
export type TabFillContext = { tabName: string; fields?: string[] }

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : ''
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function mapEntriesFromPayload(payload: SectionFillPayload): GenericFillEntry[] {
  if (!Array.isArray(payload.entries)) return []
  const out: GenericFillEntry[] = []
  for (const row of payload.entries) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const aligned = alignLabelAndBody(text(r.title), text(r.description))
    const title = aligned.label.trim()
    const body = aligned.body.trim()
    if (!title && !body) continue
    out.push({
      title,
      subtitle: text(r.subtitle),
      description: body ? plainTextToRichHtml(body) : '',
      url: text(r.url),
      imageUrl: text(r.imageUrl),
      date: text(r.date),
      location: text(r.location),
      price: text(r.price),
      offerPrice: text(r.offerPrice),
    })
  }
  return out
}

export function mapContentFromPayload(payload: SectionFillPayload): GenericFillContent | null {
  const c = payload.content
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null
  const r = c as Record<string, unknown>
  const aligned = alignLabelAndBody(text(r.title), text(r.description))
  const title = aligned.label.trim()
  const body = aligned.body.trim()
  if (!title && !body) return null
  return { title, description: body ? plainTextToRichHtml(body) : '' }
}

/** Section-post items for list tabs; only fields the tab's schema shows are filled. */
export function entriesToSectionPosts(
  entries: GenericFillEntry[],
  fields: readonly SectionFieldKey[]
): VCardSectionPostItem[] {
  const has = new Set(fields)
  return entries.map((e) => ({
    ...createDefaultSectionPostItem(),
    title: e.title,
    description: has.has('description') ? e.description : '',
    url: has.has('url') ? e.url : '',
    featuredImage: has.has('featuredImage') ? e.imageUrl : '',
    date: has.has('date') ? e.date : '',
    location: has.has('location') ? e.location : '',
    price: has.has('price') ? e.price : '',
    offerPrice: has.has('offerPrice') ? e.offerPrice : '',
  }))
}

export function entriesToCustomTabItems(entries: GenericFillEntry[]): VCardCustomTabItem[] {
  return entries.map((e) => ({
    id: `custom_item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: e.title,
    description: e.description,
    url: e.url,
    mediaUrl: e.imageUrl,
    active: true,
  }))
}

export function entriesToCerts(entries: GenericFillEntry[]): CertItem[] {
  return entries.map((e) => ({
    ...createEmptyCert(),
    name: e.title,
    description: e.description,
    issuer: e.subtitle,
    year: e.date,
  }))
}

export function mapEducationFromPayload(payload: SectionFillPayload): VCardEducationEntry[] {
  if (!Array.isArray(payload.education)) return []
  return payload.education
    .map((row) => {
      const r = (row || {}) as Record<string, unknown>
      return {
        id: uid('edu'),
        institute: text(r.institute),
        degree: text(r.degree),
        fromDate: text(r.fromDate),
        toDate: text(r.toDate),
        tillNow: Boolean(r.tillNow),
      }
    })
    .filter((e) => e.institute || e.degree)
}

export function mapExperienceFromPayload(payload: SectionFillPayload): VCardExperienceEntry[] {
  if (!Array.isArray(payload.experience)) return []
  return payload.experience
    .map((row) => {
      const r = (row || {}) as Record<string, unknown>
      return {
        id: uid('exp'),
        company: text(r.company),
        jobTitle: text(r.jobTitle),
        description: text(r.description) ? plainTextToRichHtml(text(r.description)) : '',
        fromDate: text(r.fromDate),
        toDate: text(r.toDate),
        tillNow: Boolean(r.tillNow),
      }
    })
    .filter((e) => e.company || e.jobTitle || e.description)
}

/** Skill groups from a paste; unlike AI card generation, a pasted list is never capped. */
export function mapSkillsFromPayload(payload: SectionFillPayload, existing: VCardSkillGroup[] = []): VCardSkillGroup[] {
  if (!Array.isArray(payload.skills)) return []
  const seen = new Set(existing.flatMap((g) => g.skills.map((s) => s.trim().toLowerCase())))
  const out: VCardSkillGroup[] = []
  for (const row of payload.skills) {
    const r = (row || {}) as Record<string, unknown>
    const skills = (Array.isArray(r.skills) ? r.skills : [])
      .map((s) => text(s))
      .filter((s) => {
        const key = s.toLowerCase()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    if (skills.length) out.push({ id: uid('skill'), type: text(r.type) || 'General', skills })
  }
  return out
}

/** Paste fallback when AI is unavailable: first line = heading, the rest = body. */
export function localContentFromText(raw: string): GenericFillContent | null {
  const lines = raw.replace(/\r\n/g, '\n').trim().split('\n')
  if (!lines.join('').trim()) return null
  const first = (lines[0] || '').trim()
  const rest = lines.slice(1).join('\n').trim()
  const looksLikeHeading = first.length <= 90 && !/[.!?]$/.test(first) && Boolean(rest)
  const title = looksLikeHeading ? first.replace(/^#+\s*/, '') : ''
  const body = looksLikeHeading ? rest : raw.trim()
  return { title, description: plainTextToRichHtml(body) }
}
