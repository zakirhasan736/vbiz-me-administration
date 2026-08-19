import { syncMyInfoFromPersonal } from '@/lib/vcardMyInfo'
import type { VCardData, VCardPersonal } from '@/types/vcard'

const PERSONAL_KEYS = [
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
] as const

type PersonalKey = (typeof PERSONAL_KEYS)[number]

function labeledValue(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const match = text.match(new RegExp(`(?:^|\\n)\\s*${label}\\s*[:\\-]\\s*(.+)`, 'i'))
    if (match?.[1]) return match[1].replace(/[.,;]+$/, '').trim()
  }
  return undefined
}

function slugFromName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

/** Parse owner-entered personal facts from free text (field popup, coach, or paste). */
export function parseOwnerPersonalFromText(text: string): Partial<VCardPersonal> & { slug?: string } {
  const personal: Partial<VCardPersonal> & { slug?: string } = {}
  const raw = text.trim()
  if (!raw) return personal

  const email = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  if (email) personal.email = email[0]

  const phone = raw.match(/(?:\+?\d[\d\s().-]{7,}\d)/)
  if (phone) personal.phone = phone[0].replace(/\s+/g, ' ').trim()

  const isoDob = raw.match(/\b(19|20)\d{2}-\d{2}-\d{2}\b/)
  const slashDob = raw.match(/\b(\d{1,2})[/-](\d{1,2})[/-]((?:19|20)\d{2})\b/)
  if (isoDob) personal.dob = isoDob[0]
  else if (slashDob) {
    const month = slashDob[1].padStart(2, '0')
    const day = slashDob[2].padStart(2, '0')
    personal.dob = `${slashDob[3]}-${month}-${day}`
  }

  const labeledName = labeledValue(raw, ['full name', 'owner name', 'public name', '(?:my )?name'])
  const named = raw.match(/(?:(?:my )?name\s*(?:is|:)|i am|i'm)\s+([A-Za-z][A-Za-z .'-]{1,70})/i)
  if (labeledName) personal.fullName = labeledName
  else if (named) personal.fullName = named[1].replace(/[.,;]+$/, '').trim()

  const cardName = labeledValue(raw, ['card name', 'vcard name', 'business name', 'company(?: name)?'])
  if (cardName) personal.company = cardName

  const website = labeledValue(raw, ['website', 'url'])
  if (website) personal.website = website

  const address = labeledValue(raw, ['address', 'location', 'service area'])
  if (address) personal.address = address

  const designation = labeledValue(raw, ['title', 'headline', 'designation', 'role'])
  if (designation) personal.designation = designation

  const slug = labeledValue(raw, ['slug', 'public url', 'card url'])
  if (slug) personal.slug = slugFromName(slug)

  const leftover = raw
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '')
    .replace(/\b(19|20)\d{2}-\d{2}-\d{2}\b/g, '')
    .replace(
      /(?:full name|card name|business name|company|email|phone|dob|date of birth|website|address)\s*[:\-].*/gi,
      ''
    )
    .replace(/(?:(?:my )?name\s*(?:is|:)|i am|i'm)\s+[A-Za-z][A-Za-z .'-]{1,70}/gi, '')
    .trim()

  if (!personal.fullName && leftover && leftover.length >= 2 && leftover.length <= 80 && !/[:@/]/.test(leftover)) {
    personal.fullName = leftover.replace(/[.,;]+$/, '').trim()
  }

  if (!personal.fullName && personal.company) personal.fullName = personal.company
  if (!personal.company && personal.fullName && /card name/i.test(raw)) personal.company = personal.fullName

  return personal
}

export function patchDraftFromFieldKey(draft: VCardData, fieldKey: string, value: unknown): VCardData {
  const text = String(value ?? '').trim()
  const personal: VCardPersonal = { ...draft.personal }
  const parsed = typeof value === 'string' ? parseOwnerPersonalFromText(value) : {}

  const assign = (key: PersonalKey, next: string) => {
    if (next) personal[key] = next as never
  }

  if (fieldKey === 'fullName') assign('fullName', text)
  else if (fieldKey === 'email') assign('email', text)
  else if (fieldKey === 'phone') {
    assign('phone', text)
    if (!personal.whatsapp) personal.whatsapp = text
  } else if (fieldKey === 'dob') assign('dob', text)
  else if (fieldKey === 'company') {
    assign('company', text)
    if (!personal.fullName) personal.fullName = text
  } else if (fieldKey === 'website') assign('website', text)
  else if (fieldKey === 'address') assign('address', text)
  else if (fieldKey === 'designation') assign('designation', text)
  else if (fieldKey === 'about') assign('about', text)
  else if (fieldKey === 'slug') {
    return syncMyInfoFromPersonal({ ...draft, slug: slugFromName(text) || draft.slug, personal })
  } else {
    for (const key of PERSONAL_KEYS) {
      const next = parsed[key]
      if (typeof next === 'string' && next.trim()) personal[key] = next as never
    }
  }

  const slug = draft.slug || slugFromName(personal.fullName || personal.company || '')
  return syncMyInfoFromPersonal({ ...draft, slug, personal })
}

export function mergeParsedPersonal(draft: VCardData, parsed: Partial<VCardPersonal> & { slug?: string }): VCardData {
  const personal: VCardPersonal = { ...draft.personal }
  for (const key of PERSONAL_KEYS) {
    const next = parsed[key]
    if (typeof next === 'string' && next.trim()) personal[key] = next as never
  }
  if (!personal.whatsapp && personal.phone) personal.whatsapp = personal.phone
  const slug = parsed.slug || draft.slug || slugFromName(personal.fullName || personal.company || '')
  return syncMyInfoFromPersonal({ ...draft, slug, personal })
}
