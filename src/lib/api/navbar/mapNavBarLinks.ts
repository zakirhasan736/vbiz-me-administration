import type { NavBarLinksData, PostTypeNavLink, StaticNavLink } from '@/interfaces/navbarLinks.interface'
import { decodeHtmlText } from '@/lib/htmlText'
import { assemblePublicNavOrder } from '@/lib/publicNavOrder'
import { CUSTOM_TAB_ID_PREFIX, NAV_ITEM_BY_ID, type NavBarNavItem } from '@/lib/vcardNavbar'
import { FileText } from 'lucide-react'

const STATIC_LINK_TO_NAV_ID: Record<string, string> = {
  home: 'home',
  resume: 'education',
  education: 'education',
  'public-cards': 'public-cards',
  'public cards': 'public-cards',
  cards: 'public-cards',
}

function normalizeKey(value: string): string {
  return decodeHtmlText(value).trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

const POST_TYPE_NAME_TO_NAV_ID: Record<string, string> = {
  home: 'home',
  services: 'services',
  clients: 'clients',
  reviews: 'reviews',
  gallery: 'gallery',
  video: 'videos',
  videos: 'videos',
  post: 'post',
  blog: 'blog',
  'about me': 'about',
  about: 'about',
  'additional services': 'additional',
  '2d video explainer': 'explainer',
  '2d explainer': 'explainer',
  announcement: 'announcement',
  'better business bureau (bbb) accreditation': 'bbb',
  bbb: 'bbb',
  booking: 'booking',
  breakfast: 'breakfast',
  'contact us': 'contact-us',
  calender: 'calendar',
  calendar: 'calendar',
  'certifications/licensing': 'certificates',
  'certifications licenses': 'certificates',
  'certifications licensing': 'certificates',
  'certifications/licenses': 'certificates',
  'certificates licenses': 'certificates',
  'certificates/licensing': 'certificates',
  'certificates/licenses': 'certificates',
  certificates: 'certificates',
  license: 'certificates',
  licenses: 'certificates',
  licensing: 'licensing',
  'department of consumer protection (dcp)': 'dcp',
  dcp: 'dcp',
  dinner: 'dinner',
  events: 'events',
  faq: 'faq',
  faqs: 'faq',
  'home solar': 'home-solar',
  'insurance license': 'insurance-license',
  inventory: 'inventory',
  'join my team': 'join-team',
  lunch: 'lunch',
  'media/press': 'press',
  'meet our team': 'meet-team',
  menu: 'menu',
  'mission statement': 'mission',
  'company mission statement': 'mission',
  'property listing': 'property-listing',
  'resiliency products': 'resiliency',
  'sales person': 'sales-24h',
  '24/h salesperson': 'sales-24h',
  'see products': 'see-product',
  'see product': 'see-product',
  'video links': 'video-links',
  'why choose us': 'who-we-are',
  'who we are': 'who-we-are',
  'work experience': 'work',
  work: 'work',
  experience: 'work',
  resume: 'education',
  education: 'education',
  skills: 'skills',
  skill: 'skills',
  'my info': 'my-info',
  'my-info': 'my-info',
}

function resolveNavIdFromLabel(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined
  const key = normalizeKey(value)
  return POST_TYPE_NAME_TO_NAV_ID[key] ?? STATIC_LINK_TO_NAV_ID[key] ?? NAV_ITEM_BY_ID[key]?.id
}

function resolvePostTypeNavId(postType: PostTypeNavLink): string | undefined {
  const key = typeof postType.key === 'string' ? postType.key.trim() : ''
  const id = String(postType.id ?? '').trim()
  return (
    (key && NAV_ITEM_BY_ID[key]?.id) ||
    (id && NAV_ITEM_BY_ID[id]?.id) ||
    resolveNavIdFromLabel(key) ||
    resolveNavIdFromLabel(id) ||
    resolveNavIdFromLabel(postType.name) ||
    resolveNavIdFromLabel(postType.title) ||
    resolveNavIdFromLabel(postType.slug) ||
    resolveNavIdFromLabel(postType.type_id)
  )
}

/** Prefer API `name` for `/dynamic-section/{name}` — falls back to title/slug. */
function resolveApiSectionName(...candidates: Array<string | null | undefined>): string | undefined {
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value) return value
  }
  return undefined
}

function withNavMeta(def: NavBarNavItem, options: { title?: string; apiSectionName?: string }): NavBarNavItem {
  const displayTitle = options.title?.trim() ? decodeHtmlText(options.title.trim()) : undefined
  const apiSectionName = options.apiSectionName?.trim()
  const next: NavBarNavItem = { ...def }
  if (displayTitle && displayTitle !== def.label && !def.displayLabel) next.displayLabel = displayTitle
  if (apiSectionName) next.apiSectionName = apiSectionName
  return next
}

function createFallbackNavItem(postType: PostTypeNavLink): NavBarNavItem {
  const title = decodeHtmlText(postType.title?.trim() || postType.name?.trim() || `Section ${postType.id}`)
  const slug = postType.slug?.trim() || ''
  const name = postType.name?.trim() || ''
  const rawId = String(postType.id || '')
  const customId = [slug, name, rawId].find((value) => value.startsWith(CUSTOM_TAB_ID_PREFIX))
  const isCustom = Boolean(customId) || postType.type === 'custom'
  const id = customId || (isCustom ? name || slug || rawId : `post-type-${postType.id}`)
  return {
    id,
    label: title,
    displayLabel: title,
    apiSectionName: isCustom
      ? resolveApiSectionName(customId, name, slug, rawId)
      : resolveApiSectionName(postType.name, postType.title, postType.slug, rawId),
    icon: FileText,
    profileContent: 'empty',
    editorPanel: isCustom && id ? { kind: 'custom-tab', tabId: id } : { kind: 'empty' },
  }
}

/** Backend profile-scoped lists may omit `active` or send 1/"true". */
function isEnabledFlag(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (value === true || value === 1 || value === '1') return true
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'active' || normalized === 'true' || normalized === 'enabled'
  }
  return false
}

function mapStaticLink(link: StaticNavLink): NavBarNavItem | null {
  if (!isEnabledFlag(link.active)) return null

  const navId =
    resolveNavIdFromLabel(link.id) ??
    resolveNavIdFromLabel(link.name) ??
    resolveNavIdFromLabel(link.title) ??
    resolveNavIdFromLabel(link.post_type)

  const def = navId ? NAV_ITEM_BY_ID[navId] : undefined
  if (!def) return null

  // Home / public-cards are not dynamic-section tabs.
  const apiSectionName =
    def.profileContent === 'home' || def.profileContent === 'public-cards'
      ? undefined
      : resolveApiSectionName(link.name, link.title, link.id)

  return withNavMeta(def, {
    title: link.title || link.name,
    apiSectionName,
  })
}

function mapPostType(postType: PostTypeNavLink): NavBarNavItem | null {
  if (!isEnabledFlag(postType.status)) return null
  const navId = resolvePostTypeNavId(postType)
  const def = navId ? NAV_ITEM_BY_ID[navId] : undefined
  const apiSectionName = resolveApiSectionName(postType.name, postType.title, postType.slug)
  if (!def) return createFallbackNavItem(postType)
  return withNavMeta(def, {
    title: postType.title || postType.name,
    apiSectionName,
  })
}

function dedupeNavItemsById(items: NavBarNavItem[]): NavBarNavItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.profileContent === 'empty' ? `empty:${item.id}` : `content:${item.profileContent}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function applyCanonicalNavItemOrder(items: NavBarNavItem[]): NavBarNavItem[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const orderedIds = assemblePublicNavOrder(
    items.map((item) => item.id),
    { preserveCustom: true }
  )
  const seen = new Set<string>()
  const next: NavBarNavItem[] = []
  for (const id of orderedIds) {
    if (seen.has(id)) continue
    const item = byId.get(id)
    if (!item) continue
    seen.add(id)
    next.push(item)
  }
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    next.push(item)
  }
  return next
}

/**
 * Maps `GET /post-types?profile_id=` into profile nav items.
 * When `post_types` is present it is the selected Add Tabs list, in that order.
 * Each item keeps `apiSectionName` for `GET /dynamic-section/{name}?profile_id=`.
 */
export function mapNavBarLinks(data: NavBarLinksData | undefined | null): NavBarNavItem[] {
  if (!data) return []

  const staticItems = (data.StaticLink ?? []).map(mapStaticLink).filter((item): item is NavBarNavItem => Boolean(item))
  const postTypeItems = (data.post_types ?? []).map(mapPostType).filter((item): item is NavBarNavItem => Boolean(item))

  if (postTypeItems.length) {
    const ids = new Set(postTypeItems.map((item) => item.id))
    const missingStatic = staticItems.filter((item) => !ids.has(item.id))
    const hasHome = ids.has('home')
    return applyCanonicalNavItemOrder(
      dedupeNavItemsById(hasHome ? [...postTypeItems, ...missingStatic] : [...missingStatic, ...postTypeItems])
    )
  }

  return applyCanonicalNavItemOrder(dedupeNavItemsById(staticItems))
}
