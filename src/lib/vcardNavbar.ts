import {
  ALWAYS_ENABLED_NAV_IDS,
  getDefaultCreateCardNavIds,
  normalizeNavOrderWithPinnedEnds,
  normalizeNavOrderWithRequiredTabs,
} from '@/lib/createCardTabs'
import type { VCardCustomTab, VCardTabLabelOverrides } from '@/types/vcard'
import {
  createDefaultFieldConfig,
  normalizeFieldConfig,
  type DisplayFieldConfig,
  type VCardDisplaySettings,
} from '@/types/vcardDisplaySettings'
import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  Camera,
  Coffee,
  Contact,
  FileEdit,
  FileText,
  Film,
  Globe2,
  GraduationCap,
  Handshake,
  Headphones,
  Home,
  IdCard,
  Images,
  Landmark,
  Layers,
  Lightbulb,
  Megaphone,
  Menu,
  Mic,
  Newspaper,
  Package,
  Phone,
  PlaySquare,
  ScrollText,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Star,
  Sun,
  Ticket,
  User,
  UserPlus,
  UsersRound,
  Utensils,
  UtensilsCrossed,
  Video,
  Wand2,
  Wrench,
} from 'lucide-react'

/** Global nav chrome color — not a profile tab. */
export const NAV_BACKGROUND_COLOR_FIELD = 'Nav Background Color' as const

/**
 * Merged profile navigation from v1 + v2 reference apps.
 * Order matches the icon strip shown in both profile templates.
 */
export const MERGED_PROFILE_NAV_LABELS = [
  'Home',
  'About Me',
  'Company Mission Statement',
  'Services',
  'Gallery',
  'Videos',
  'Reviews',
  'BBB',
  'Faq',
  'Education',
  'Skills',
  'Blog',
  'Additional Services',
  '2D Explainer',
  'Certifications/Licenses',
  'Clients',
  'Meet Our Team',
  'Calender',
  'Work Experience',
  'Video Links',
  'Profile',
  'Resume',
  'Content & media',
  'Global Connection',
  'Public Cards',
  'My Info',
] as const

export type ProfileNavContentKey =
  | 'home'
  | 'about'
  | 'mission'
  | 'services'
  | 'additional'
  | 'blog'
  | 'post'
  | 'videos'
  | 'video-links'
  | 'why-choose-us'
  | 'gallery'
  | 'explainer'
  | 'reviews'
  | 'certificates'
  | 'education'
  | 'work'
  | 'skills'
  | 'calendar'
  | 'events'
  | 'booking'
  | 'menu'
  | 'sales-person'
  | 'see-products'
  | 'public-cards'
  | 'clients'
  | 'meet-team'
  | 'join-my-team'
  | 'faq'
  | 'bbb'
  | 'dcp'
  | 'home-solar'
  | 'resiliency-products'
  | 'property-listing'
  | 'media-press'
  | 'announcement'
  | 'breakfast'
  | 'contact-us'
  | 'dinner'
  | 'lunch'
  | 'inventory'
  | 'licensing'
  | 'insurance-license'
  | 'profile'
  | 'resume'
  | 'content-media'
  | 'global-connection'
  | 'my-info'
  | 'empty'

export type EditorNavPanel =
  | { kind: 'personal'; subTab?: number }
  | { kind: 'about-me' }
  | { kind: 'education' }
  | { kind: 'experience' }
  | { kind: 'skill' }
  | { kind: 'services' }
  | { kind: 'portfolio' }
  | { kind: 'reviews' }
  | { kind: 'blog' }
  | { kind: 'faq' }
  | { kind: 'link-shortener' }
  | { kind: 'profile' }
  | { kind: 'resume' }
  | { kind: 'content-media' }
  | { kind: 'global-connection' }
  | { kind: 'my-info' }
  | { kind: 'certificates' }
  | { kind: 'section-posts'; schemaKey: ProfileNavContentKey }
  | { kind: 'custom-tab'; tabId: string }
  | { kind: 'info'; infoKey: 'public-cards' }
  | { kind: 'empty' }

export type NavBarNavItem = {
  id: string
  /** Card Settings → Nav Bar field key (visibility / colors). */
  label: string
  /** Optional API title override for tooltips / aria labels. */
  displayLabel?: string
  /** Editor main-strip label (public nav still uses `label` / `displayLabel`). */
  editorLabel?: string
  /**
   * Exact section key from `/post-types` (`name` for post types / static links).
   * Used as `GET /dynamic-section/{apiSectionName}?profile_id=`.
   */
  apiSectionName?: string
  icon: LucideIcon
  profileContent: ProfileNavContentKey
  editorPanel: EditorNavPanel
}

const NAV_ITEM_DEFS: NavBarNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    editorLabel: 'Personal',
    icon: Home,
    profileContent: 'home',
    editorPanel: { kind: 'personal', subTab: 1 },
  },
  { id: 'about', label: 'About Me', icon: User, profileContent: 'about', editorPanel: { kind: 'about-me' } },
  {
    id: 'mission',
    label: 'Company Mission Statement',
    icon: ScrollText,
    profileContent: 'mission',
    editorPanel: { kind: 'section-posts', schemaKey: 'mission' },
  },
  {
    id: 'education',
    label: 'Education',
    icon: GraduationCap,
    profileContent: 'education',
    editorPanel: { kind: 'education' },
  },
  {
    id: 'skills',
    label: 'Skills',
    displayLabel: 'Skill',
    icon: Wand2,
    profileContent: 'skills',
    editorPanel: { kind: 'skill' },
  },
  { id: 'services', label: 'Services', icon: Wrench, profileContent: 'services', editorPanel: { kind: 'services' } },
  {
    id: 'gallery',
    label: 'Gallery',
    displayLabel: 'Photos',
    icon: Camera,
    profileContent: 'gallery',
    editorPanel: { kind: 'portfolio' },
  },
  {
    id: 'videos',
    label: 'Videos',
    icon: Film,
    profileContent: 'videos',
    editorPanel: { kind: 'section-posts', schemaKey: 'videos' },
  },
  {
    id: 'blog',
    label: 'Blog',
    displayLabel: 'Blogs and Media',
    icon: FileEdit,
    profileContent: 'blog',
    editorPanel: { kind: 'blog' },
  },
  { id: 'post', label: 'Post', icon: Newspaper, profileContent: 'post', editorPanel: { kind: 'blog' } },
  {
    id: 'profile',
    label: 'Profile',
    icon: IdCard,
    profileContent: 'profile',
    editorPanel: { kind: 'profile' },
  },
  {
    id: 'resume',
    label: 'Resume',
    icon: FileText,
    profileContent: 'resume',
    editorPanel: { kind: 'resume' },
  },
  {
    id: 'content-media',
    label: 'Content & media',
    icon: Images,
    profileContent: 'content-media',
    editorPanel: { kind: 'content-media' },
  },
  {
    id: 'global-connection',
    label: 'Global Connection',
    icon: Globe2,
    profileContent: 'global-connection',
    editorPanel: { kind: 'global-connection' },
  },
  {
    id: 'my-info',
    label: 'My Info',
    icon: Contact,
    profileContent: 'my-info',
    editorPanel: { kind: 'my-info' },
  },
  {
    id: 'additional',
    label: 'Additional Services',
    icon: Layers,
    profileContent: 'additional',
    editorPanel: { kind: 'section-posts', schemaKey: 'additional' },
  },
  {
    id: 'explainer',
    label: '2D Explainer',
    icon: PlaySquare,
    profileContent: 'explainer',
    editorPanel: { kind: 'section-posts', schemaKey: 'explainer' },
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: Star,
    profileContent: 'reviews',
    editorPanel: { kind: 'reviews' },
  },
  {
    id: 'certificates',
    label: 'Certifications/Licenses',
    icon: Award,
    profileContent: 'certificates',
    editorPanel: { kind: 'certificates' },
  },
  {
    id: 'insurance-license',
    label: 'Insurance License',
    icon: ShieldCheck,
    profileContent: 'insurance-license',
    editorPanel: { kind: 'section-posts', schemaKey: 'insurance-license' },
  },
  {
    id: 'licensing',
    label: 'Licensing',
    icon: BadgeCheck,
    profileContent: 'licensing',
    editorPanel: { kind: 'section-posts', schemaKey: 'licensing' },
  },
  {
    id: 'public-cards',
    label: 'Public Cards',
    icon: IdCard,
    profileContent: 'public-cards',
    editorPanel: { kind: 'info', infoKey: 'public-cards' },
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Handshake,
    profileContent: 'clients',
    editorPanel: { kind: 'section-posts', schemaKey: 'clients' },
  },
  {
    id: 'meet-team',
    label: 'Meet Our Team',
    icon: UsersRound,
    profileContent: 'meet-team',
    editorPanel: { kind: 'section-posts', schemaKey: 'meet-team' },
  },
  {
    id: 'calendar',
    label: 'Calender',
    icon: Calendar,
    profileContent: 'calendar',
    editorPanel: { kind: 'section-posts', schemaKey: 'calendar' },
  },
  {
    id: 'faq',
    label: 'Faq',
    displayLabel: 'FAQs',
    editorLabel: 'FAQs',
    icon: Lightbulb,
    profileContent: 'faq',
    editorPanel: { kind: 'faq' },
  },
  {
    id: 'work',
    label: 'Work Experience',
    displayLabel: 'Experience',
    icon: Briefcase,
    profileContent: 'work',
    editorPanel: { kind: 'experience' },
  },
  {
    id: 'video-links',
    label: 'Video Links',
    icon: Video,
    profileContent: 'video-links',
    editorPanel: { kind: 'section-posts', schemaKey: 'video-links' },
  },
  {
    id: 'announcement',
    label: 'Announcement',
    icon: Megaphone,
    profileContent: 'announcement',
    editorPanel: { kind: 'section-posts', schemaKey: 'announcement' },
  },
  {
    id: 'bbb',
    label: 'BBB',
    icon: Shield,
    profileContent: 'bbb',
    editorPanel: { kind: 'section-posts', schemaKey: 'bbb' },
  },
  {
    id: 'booking',
    label: 'Booking',
    icon: CalendarCheck,
    profileContent: 'booking',
    editorPanel: { kind: 'section-posts', schemaKey: 'booking' },
  },
  {
    id: 'breakfast',
    label: 'Breakfast',
    icon: Coffee,
    profileContent: 'breakfast',
    editorPanel: { kind: 'section-posts', schemaKey: 'breakfast' },
  },
  {
    id: 'contact-us',
    label: 'Contact Us',
    icon: Phone,
    profileContent: 'contact-us',
    apiSectionName: 'Contact Us',
    editorPanel: { kind: 'section-posts', schemaKey: 'contact-us' },
  },
  {
    id: 'dcp',
    label: 'DCP',
    icon: FileText,
    profileContent: 'dcp',
    editorPanel: { kind: 'section-posts', schemaKey: 'dcp' },
  },
  {
    id: 'dinner',
    label: 'Dinner',
    icon: Utensils,
    profileContent: 'dinner',
    editorPanel: { kind: 'section-posts', schemaKey: 'dinner' },
  },
  {
    id: 'events',
    label: 'Events',
    icon: Ticket,
    profileContent: 'events',
    editorPanel: { kind: 'section-posts', schemaKey: 'events' },
  },
  {
    id: 'home-solar',
    label: 'Home Solar',
    icon: Sun,
    profileContent: 'home-solar',
    editorPanel: { kind: 'section-posts', schemaKey: 'home-solar' },
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    profileContent: 'inventory',
    editorPanel: { kind: 'section-posts', schemaKey: 'inventory' },
  },
  {
    id: 'join-team',
    label: 'Join My Team',
    icon: UserPlus,
    profileContent: 'join-my-team',
    editorPanel: { kind: 'section-posts', schemaKey: 'join-my-team' },
  },
  {
    id: 'lunch',
    label: 'Lunch',
    icon: UtensilsCrossed,
    profileContent: 'lunch',
    editorPanel: { kind: 'section-posts', schemaKey: 'lunch' },
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: Menu,
    profileContent: 'menu',
    editorPanel: { kind: 'section-posts', schemaKey: 'menu' },
  },
  {
    id: 'press',
    label: 'Press/Media',
    icon: Mic,
    profileContent: 'media-press',
    editorPanel: { kind: 'section-posts', schemaKey: 'media-press' },
  },
  {
    id: 'property-listing',
    label: 'Property Listing',
    icon: Building2,
    profileContent: 'property-listing',
    editorPanel: { kind: 'section-posts', schemaKey: 'property-listing' },
  },
  {
    id: 'resiliency',
    label: 'Resiliency Products',
    icon: ShieldCheck,
    profileContent: 'resiliency-products',
    editorPanel: { kind: 'section-posts', schemaKey: 'resiliency-products' },
  },
  {
    id: 'see-product',
    label: 'See Product',
    icon: ShoppingBag,
    profileContent: 'see-products',
    editorPanel: { kind: 'section-posts', schemaKey: 'see-products' },
  },
  {
    id: 'sales-24h',
    label: '24/h SalesPerson',
    icon: Headphones,
    profileContent: 'sales-person',
    editorPanel: { kind: 'section-posts', schemaKey: 'sales-person' },
  },
  {
    id: 'who-we-are',
    label: 'Who We Are',
    icon: Landmark,
    profileContent: 'why-choose-us',
    editorPanel: { kind: 'section-posts', schemaKey: 'why-choose-us' },
  },
]

export const NAV_ITEM_BY_ID: Record<string, NavBarNavItem> = Object.fromEntries(
  NAV_ITEM_DEFS.map((item) => [item.id, item])
)

const MERGED_SET = new Set<string>(MERGED_PROFILE_NAV_LABELS)
const EXTENDED_NAV_LABELS = NAV_ITEM_DEFS.map((item) => item.label).filter((label) => !MERGED_SET.has(label))

/** Industry / extended nav items hidden until explicitly enabled in Card Settings. */
export const NAV_LABELS_HIDDEN_BY_DEFAULT = new Set([
  '24/h SalesPerson',
  'See Product',
  'Resiliency Products',
  'Property Listing',
  'Press/Media',
  'Menu',
  'Lunch',
  'Join My Team',
  'Inventory',
  'Home Solar',
  'Dinner',
  'DCP',
  'Breakfast',
  'BBB',
  'Announcement',
  'Insurance License',
  'Licensing',
])

export function createDefaultNavFieldConfig(label: string): DisplayFieldConfig {
  return createDefaultFieldConfig(NAV_LABELS_HIDDEN_BY_DEFAULT.has(label) ? { visible: false } : undefined)
}

/** Card Settings → Nav Bar field order (merged tabs first, industry extras, chrome last). */
export const NAV_BAR_FIELDS = [
  ...MERGED_PROFILE_NAV_LABELS,
  ...EXTENDED_NAV_LABELS,
  NAV_BACKGROUND_COLOR_FIELD,
] as const

/** Nav items in Card Settings order (excludes Nav Background Color). */
export const NAV_BAR_NAV_ITEMS: NavBarNavItem[] = NAV_BAR_FIELDS.filter((key) => key !== NAV_BACKGROUND_COLOR_FIELD)
  .map((label) => NAV_ITEM_DEFS.find((item) => item.label === label))
  .filter((item): item is NavBarNavItem => Boolean(item))

export const TAB_ID_TO_NAV_LABEL: Record<string, string> = Object.fromEntries(
  NAV_BAR_NAV_ITEMS.map((item) => [item.id, item.label])
)

export const NAV_LABEL_TO_TAB_ID: Record<string, string> = Object.fromEntries(
  NAV_BAR_NAV_ITEMS.map((item) => [item.label, item.id])
)

function navFieldLookupKeys(label: string): string[] {
  if (label === 'FAQs') return ['FAQs', 'Faq']
  if (label === 'Faq') return ['Faq', 'FAQs']
  return [label]
}

export function isNavItemVisible(settings: VCardDisplaySettings, label: string): boolean {
  if (!settings.globalEnabled) return false
  for (const key of navFieldLookupKeys(label)) {
    const raw = settings.fields[key]
    if (raw) {
      return normalizeFieldConfig({ ...createDefaultNavFieldConfig(key), ...raw }).visible
    }
  }
  return createDefaultNavFieldConfig(label).visible
}

export function filterNavItemsByVisibility(items: NavBarNavItem[], settings: VCardDisplaySettings): NavBarNavItem[] {
  return items.filter((item) => LOCKED_NAV_ITEM_IDS.has(item.id) || isNavItemVisible(settings, item.label))
}

/**
 * Public + editor nav: every tab the owner enabled in Add Tabs, in that saved order.
 * Empty sections still appear. Data from `/post-types` is not required when editorNavOrder is set.
 */
export function selectEnabledNavItems(catalog: NavBarNavItem[], settings: VCardDisplaySettings): NavBarNavItem[] {
  const byId = new Map(catalog.map((item) => [item.id, item]))
  const normalize = settings.navOrderCustomized ? normalizeNavOrderWithRequiredTabs : normalizeNavOrderWithPinnedEnds
  const savedOrder =
    Array.isArray(settings.editorNavOrder) && settings.editorNavOrder.length > 0
      ? normalize(settings.editorNavOrder)
      : null

  if (savedOrder) {
    const fromSaved = savedOrder
      .map((id) => byId.get(id))
      .filter((item): item is NavBarNavItem => Boolean(item))
      .filter(
        (item) =>
          LOCKED_NAV_ITEM_IDS.has(item.id) || isCustomNavItemId(item.id) || isNavItemVisible(settings, item.label)
      )
    if (fromSaved.length) return fromSaved
  }

  const visible = filterNavItemsByVisibility(catalog, settings)
  return sortNavItemsByOrder(visible, normalize(visible.map((item) => item.id)))
}

/**
 * Editor tabs must mirror the Add tab modal exactly: same enabled tabs,
 * same labels, and same saved order.
 */
export const EDITOR_COLLAPSED_INTO_PERSONAL_IDS = new Set<string>()
export const EDITOR_HIDDEN_MAIN_NAV_IDS = new Set<string>()

export function filterEditorMainNavItems(items: NavBarNavItem[]): NavBarNavItem[] {
  return items.filter(
    (item) => !EDITOR_COLLAPSED_INTO_PERSONAL_IDS.has(item.id) && !EDITOR_HIDDEN_MAIN_NAV_IDS.has(item.id)
  )
}

/** Whether this nav id should highlight the Personal (home) chip in the editor. */
export function isPersonalEditorNavId(id: string): boolean {
  return id === 'home'
}

export function getNavItemBackgroundColor(settings: VCardDisplaySettings, label: string): string | undefined {
  for (const key of navFieldLookupKeys(label)) {
    const bg = settings.fields[key]?.backgroundColor?.trim()
    if (bg) return bg
  }
  return undefined
}

export function getNavItemById(id: string, items: NavBarNavItem[] = NAV_BAR_NAV_ITEMS): NavBarNavItem | undefined {
  return items.find((item) => item.id === id)
}

/** Map an editor panel onto a public nav tab the live card actually shows. */
export function resolvePublicPreviewSectionId(editorSectionId: string, visibleIds: string[]): string {
  const ids = visibleIds.filter((id) => typeof id === 'string' && id.trim())
  const visible = new Set(ids)
  if (visible.has(editorSectionId)) return editorSectionId
  if (editorSectionId === 'global-connection' && visible.has('public-cards')) return 'public-cards'
  if (editorSectionId === 'public-cards' && visible.has('global-connection')) return 'global-connection'
  return ids[0] || 'home'
}

export const CUSTOM_TAB_ID_PREFIX = 'custom-tab-'

export function isCustomNavItemId(id: string): boolean {
  return id.startsWith(CUSTOM_TAB_ID_PREFIX)
}

export function createCustomNavItem(tab: VCardCustomTab): NavBarNavItem {
  const label = tab.label.trim() || 'Custom tab'
  return {
    id: tab.id,
    label,
    displayLabel: label,
    editorLabel: label,
    apiSectionName: tab.id,
    icon: FileText,
    profileContent: 'empty',
    editorPanel: { kind: 'custom-tab', tabId: tab.id },
  }
}

export function buildCustomNavItems(customTabs?: VCardCustomTab[] | null): NavBarNavItem[] {
  return (customTabs || []).filter((tab) => isCustomNavItemId(tab.id)).map((tab) => createCustomNavItem(tab))
}

export function mergeCustomNavItems(items: NavBarNavItem[], customTabs?: VCardCustomTab[] | null): NavBarNavItem[] {
  const existing = new Set(items.map((item) => item.id))
  const customItems = buildCustomNavItems(customTabs).filter((item) => !existing.has(item.id))
  return customItems.length ? [...items, ...customItems] : items
}

/** Renames are ignored until the user types at least this many characters. */
export const MIN_NAV_LABEL_LENGTH = 2

export function getNavLabelOverride(id: string, overrides?: VCardTabLabelOverrides | null): string | undefined {
  const label = overrides?.[id]?.trim()
  if (!label || label.length < MIN_NAV_LABEL_LENGTH) return undefined
  return label
}

export function applyNavLabelOverrides(
  items: NavBarNavItem[],
  overrides?: VCardTabLabelOverrides | null
): NavBarNavItem[] {
  if (!overrides || Object.keys(overrides).length === 0) return items
  return items.map((item) => {
    const label = getNavLabelOverride(item.id, overrides)
    return label ? { ...item, displayLabel: label, editorLabel: label } : item
  })
}

export function getNavDisplayLabel(item: NavBarNavItem): string {
  return item.displayLabel ?? item.label
}

/** Label shown on the vCard editor main nav strip. */
export function getEditorNavLabel(item: NavBarNavItem): string {
  return item.editorLabel ?? item.displayLabel ?? item.label
}

/** Always kept enabled in the Add-tab modal (same role as Personal in backoffice). */
export const LOCKED_NAV_ITEM_IDS = new Set<string>(ALWAYS_ENABLED_NAV_IDS)

export type NavItemGroupId = 'essentials' | 'profile' | 'content' | 'business' | 'tools'

export const NAV_ITEM_GROUPS: { id: NavItemGroupId; label: string }[] = [
  { id: 'essentials', label: 'Essentials' },
  { id: 'profile', label: 'Profile' },
  { id: 'content', label: 'Content & media' },
  { id: 'business', label: 'Business' },
  { id: 'tools', label: 'Tools' },
]

const NAV_ITEM_GROUP_BY_ID: Record<string, NavItemGroupId> = {
  home: 'essentials',
  about: 'essentials',
  services: 'essentials',
  reviews: 'essentials',
  blog: 'essentials',
  post: 'essentials',
  education: 'profile',
  skills: 'profile',
  work: 'profile',
  gallery: 'profile',
  certificates: 'profile',
  profile: 'profile',
  resume: 'profile',
  'content-media': 'content',
  'global-connection': 'tools',
  'my-info': 'tools',
  'insurance-license': 'profile',
  licensing: 'profile',
  mission: 'content',
  videos: 'content',
  additional: 'content',
  explainer: 'content',
  faq: 'content',
  'video-links': 'content',
  announcement: 'content',
  breakfast: 'content',
  dinner: 'content',
  lunch: 'content',
  menu: 'content',
  events: 'content',
  calendar: 'content',
  press: 'content',
  'who-we-are': 'content',
  'contact-us': 'content',
  clients: 'business',
  'meet-team': 'business',
  booking: 'business',
  bbb: 'business',
  dcp: 'business',
  'home-solar': 'business',
  inventory: 'business',
  'join-team': 'business',
  'property-listing': 'business',
  resiliency: 'business',
  'see-product': 'business',
  'sales-24h': 'business',
  'public-cards': 'tools',
}

export function getNavItemGroup(item: NavBarNavItem): NavItemGroupId {
  return NAV_ITEM_GROUP_BY_ID[item.id] ?? 'content'
}

/** Card Settings Nav Bar rows: Add Tabs order first, then remaining catalog keys. */
export function getNavBarSettingKeysInOrder(settings: VCardDisplaySettings): string[] {
  const order =
    Array.isArray(settings.editorNavOrder) && settings.editorNavOrder.length > 0
      ? normalizeNavOrderWithPinnedEnds(settings.editorNavOrder)
      : []
  const orderedLabels = order.map((id) => TAB_ID_TO_NAV_LABEL[id]).filter((label): label is string => Boolean(label))
  const seen = new Set(orderedLabels)
  const rest = NAV_BAR_FIELDS.filter((key) => key !== NAV_BACKGROUND_COLOR_FIELD && !seen.has(key))
  return [...orderedLabels, ...rest, NAV_BACKGROUND_COLOR_FIELD]
}

/** Enable All keeps the current Add Tabs order and appends any missing catalog tabs. */
export function navIdsAfterEnableAll(settings: VCardDisplaySettings, enabled: boolean): string[] {
  if (!enabled) {
    return NAV_BAR_NAV_ITEMS.filter((item) => LOCKED_NAV_ITEM_IDS.has(item.id)).map((item) => item.id)
  }
  const catalogIds = NAV_BAR_NAV_ITEMS.map((item) => item.id)
  const catalogSet = new Set(catalogIds)
  const current =
    Array.isArray(settings.editorNavOrder) && settings.editorNavOrder.length > 0
      ? settings.editorNavOrder.filter((id) => catalogSet.has(id) || isCustomNavItemId(id))
      : NAV_BAR_NAV_ITEMS.filter(
          (item) => LOCKED_NAV_ITEM_IDS.has(item.id) || settings.fields[item.label]?.visible !== false
        ).map((item) => item.id)
  const seen = new Set(current)
  return [...current, ...catalogIds.filter((id) => !seen.has(id))]
}

export function sortNavItemsByOrder(items: NavBarNavItem[], orderIds: string[]): NavBarNavItem[] {
  if (!orderIds.length) return items
  const rank = new Map(orderIds.map((id, index) => [id, index]))
  return [...items].sort((a, b) => {
    const ra = rank.has(a.id) ? (rank.get(a.id) as number) : Number.MAX_SAFE_INTEGER
    const rb = rank.has(b.id) ? (rank.get(b.id) as number) : Number.MAX_SAFE_INTEGER
    if (ra !== rb) return ra - rb
    return 0
  })
}

export function storageKeyForEditorNavOrder(cardKey: string) {
  return `vcard_editor_nav_order_v1_${cardKey}`
}

export function getDefaultEnabledNavIds(): string[] {
  return getDefaultCreateCardNavIds()
}
