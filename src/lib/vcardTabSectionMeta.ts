import type { VCardTabSectionMeta, VCardTabSectionMetaEntry } from '@/types/vcard'

export const TAB_SECTION_META_SETTING_KEY = 'tab_section_meta_json'

export const GENERIC_BANNER_DESCRIPTION = 'Content from your vBiz profile.'

const DEFAULT_BANNER_DESCRIPTIONS: Record<string, string> = {
  about: 'Learn more about the person and story behind this card.',
  mission: 'Our purpose and the values that guide our work.',
  education: 'Degrees, institutions, and study timelines from this profile.',
  skills: 'Skills and specialties highlighted on this profile.',
  services: 'Services and offerings from your vBiz profile.',
  gallery: 'Browse curated gallery images from this profile.',
  videos: 'Browse published video and gallery items from this profile.',
  blog: 'Articles and updates from your vBiz profile.',
  profile: 'Public name, role, and bio from this vBiz card.',
  resume: 'Summary and documents from your vBiz resume.',
  'content-media': 'Gallery images and videos from your vBiz card.',
  'global-connection': 'Connect and grow your professional network.',
  'my-info': 'Call, text, or email from this card.',
  additional: 'Additional services and offerings from this profile.',
  explainer: 'Watch a short explainer for this card.',
  reviews: 'Read what clients and partners are saying.',
  certificates: 'Showcasing recognized licenses and certifications.',
  'insurance-license': 'Verified insurance licenses and coverage credentials on file.',
  licensing: 'Verified licenses and professional credentials on file.',
  'public-cards': 'Other public cards from this profile.',
  clients: 'Proud to partner with forward-thinking companies.',
  'meet-team': 'The dedicated professionals behind your success.',
  'join-my-team': 'Explore open opportunities and join our growing team.',
  faq: 'Answers to common questions about this profile.',
  bbb: 'Better Business Bureau accreditation and trust details.',
  dcp: 'Department of Consumer Protection information on file.',
  'home-solar': 'Explore home solar offerings and solutions.',
  'resiliency-products': 'Explore resiliency products and solutions.',
  'property-listing': 'Browse available properties and listings.',
  'media-press': 'Featured press coverage, articles, and media highlights.',
  announcement: 'Latest announcements and updates shared on this profile.',
  calendar: 'Find a time that works for you and book a conversation.',
  events: 'Stay up to date with upcoming events and appearances.',
  booking: 'Ready to plan your next event? Book a time that works.',
  menu: "Explore our offerings and discover what's available today.",
  breakfast: 'Start your day with our breakfast offerings.',
  lunch: 'Discover our lunch offerings for midday.',
  dinner: 'Explore our dinner offerings for the evening.',
  inventory: 'Browse our current inventory and available items.',
  'see-products': 'Browse featured products and open full details.',
  'sales-person': 'Reach out directly to your sales contact.',
  work: 'Roles, companies, and career milestones from your profile.',
  'why-choose-us': 'Reasons clients and partners choose to work with us.',
}

export function defaultBannerDescription(tabId?: string | null): string {
  const id = tabId?.trim() || ''
  if (!id) return GENERIC_BANNER_DESCRIPTION
  if (DEFAULT_BANNER_DESCRIPTIONS[id]) return DEFAULT_BANNER_DESCRIPTIONS[id]
  if (id.startsWith('custom-tab-')) return 'Updates and information shared on this tab.'
  return GENERIC_BANNER_DESCRIPTION
}

export function emptyTabSectionMetaEntry(): VCardTabSectionMetaEntry {
  return {}
}

function cleanMetaString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function pickMetaEntry(entry: Partial<VCardTabSectionMetaEntry>): VCardTabSectionMetaEntry | null {
  const next: VCardTabSectionMetaEntry = {}
  const bannerTitle = cleanMetaString(entry.bannerTitle)
  const bannerDescription = cleanMetaString(entry.bannerDescription)
  const notes = cleanMetaString(entry.notes)
  const leaveReviewUrl = cleanMetaString(entry.leaveReviewUrl)
  if (bannerTitle !== undefined) next.bannerTitle = bannerTitle
  if (bannerDescription !== undefined) next.bannerDescription = bannerDescription
  if (notes !== undefined) next.notes = notes
  if (leaveReviewUrl !== undefined) next.leaveReviewUrl = leaveReviewUrl
  return Object.keys(next).length > 0 ? next : null
}

export function parseTabSectionMeta(raw?: string | null): VCardTabSectionMeta {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const next: VCardTabSectionMeta = {}
    for (const [tabId, value] of Object.entries(parsed)) {
      const id = tabId.trim()
      if (!id || !value || typeof value !== 'object' || Array.isArray(value)) continue
      const entry = pickMetaEntry(value as Partial<VCardTabSectionMetaEntry>)
      if (!entry) continue
      next[id] = entry
    }
    return next
  } catch {
    return {}
  }
}

export function serializeTabSectionMeta(meta?: VCardTabSectionMeta | null): string {
  const cleaned: VCardTabSectionMeta = {}
  for (const [tabId, entry] of Object.entries(meta || {})) {
    const id = tabId.trim()
    if (!id || !entry) continue
    const nextEntry = pickMetaEntry(entry)
    if (!nextEntry) continue
    cleaned[id] = nextEntry
  }
  return JSON.stringify(cleaned)
}

export function getTabSectionMetaEntry(
  meta: VCardTabSectionMeta | null | undefined,
  tabId?: string | null
): VCardTabSectionMetaEntry {
  const id = tabId?.trim() || ''
  if (!id) return {}
  return meta?.[id] ?? {}
}

export function upsertTabSectionMetaEntry(
  meta: VCardTabSectionMeta | null | undefined,
  tabId: string,
  patch: VCardTabSectionMetaEntry
): VCardTabSectionMeta {
  const id = tabId.trim()
  if (!id) return { ...(meta || {}) }
  const current = getTabSectionMetaEntry(meta, id)
  const nextEntry: VCardTabSectionMetaEntry = {
    bannerTitle: patch.bannerTitle === undefined ? current.bannerTitle : patch.bannerTitle,
    bannerDescription: patch.bannerDescription === undefined ? current.bannerDescription : patch.bannerDescription,
    notes: patch.notes === undefined ? current.notes : patch.notes,
    leaveReviewUrl: patch.leaveReviewUrl === undefined ? current.leaveReviewUrl : patch.leaveReviewUrl,
  }
  const hasTitle = Boolean(nextEntry.bannerTitle?.trim())
  const hasDescription = nextEntry.bannerDescription !== undefined
  const hasNotes = Boolean(nextEntry.notes?.trim())
  const hasLeaveReviewUrl = Boolean(nextEntry.leaveReviewUrl?.trim())
  const next = { ...(meta || {}) }
  if (!hasTitle && !hasDescription && !hasNotes && !hasLeaveReviewUrl) {
    delete next[id]
    return next
  }
  const stored: VCardTabSectionMetaEntry = {}
  if (hasTitle) stored.bannerTitle = nextEntry.bannerTitle
  if (hasDescription) stored.bannerDescription = nextEntry.bannerDescription
  if (hasNotes) stored.notes = nextEntry.notes
  if (hasLeaveReviewUrl) stored.leaveReviewUrl = nextEntry.leaveReviewUrl?.trim()
  next[id] = stored
  return next
}

export type ResolvedSectionBanner = {
  title: string
  description: string
  notes: string
  leaveReviewUrl: string
}

export function resolveSectionBanner(input: {
  tabId?: string | null
  tabName?: string | null
  meta?: VCardTabSectionMetaEntry | null
  fallbackDescription?: string | null
}): ResolvedSectionBanner {
  const tabName = input.tabName?.trim() || ''
  const title = input.meta?.bannerTitle?.trim() || tabName
  const description =
    input.meta?.bannerDescription === undefined
      ? input.fallbackDescription?.trim() || defaultBannerDescription(input.tabId)
      : input.meta.bannerDescription.trim()
  const notes = input.meta?.notes?.trim() || ''
  const leaveReviewUrl = input.meta?.leaveReviewUrl?.trim() || ''
  return { title, description, notes, leaveReviewUrl }
}
