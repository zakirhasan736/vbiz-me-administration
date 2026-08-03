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
  CalendarDays,
  Camera,
  Coffee,
  FileEdit,
  FileText,
  Film,
  GraduationCap,
  Handshake,
  Headphones,
  Home,
  IdCard,
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
  'Resume',
  'Services',
  'Gallery',
  'Videos',
  'Blog',
  'Additional Services',
  '2D Explainer',
  'Reviews',
  'Certifications/Licenses',
  'Public Cards',
  'Clients',
  'Meet Our Team',
  'Calender',
  'Faq',
  'Work Experience',
  'Video Links',
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
  | 'dinner'
  | 'lunch'
  | 'inventory'
  | 'licensing'
  | 'insurance-license'
  | 'empty'

export type EditorNavPanel =
  | { kind: 'personal'; subTab?: number }
  | { kind: 'education' }
  | { kind: 'experience' }
  | { kind: 'skill' }
  | { kind: 'services' }
  | { kind: 'portfolio' }
  | { kind: 'blog' }
  | { kind: 'faq' }
  | { kind: 'link-shortener' }
  | { kind: 'empty' }

export type NavBarNavItem = {
  id: string
  /** Card Settings → Nav Bar field key (visibility / colors). */
  label: string
  /** Optional API title override for tooltips / aria labels. */
  displayLabel?: string
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
  { id: 'home', label: 'Home', icon: Home, profileContent: 'home', editorPanel: { kind: 'personal', subTab: 1 } },
  { id: 'about', label: 'About Me', icon: User, profileContent: 'about', editorPanel: { kind: 'personal', subTab: 2 } },
  {
    id: 'mission',
    label: 'Company Mission Statement',
    icon: ScrollText,
    profileContent: 'mission',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'education',
    label: 'Resume',
    icon: GraduationCap,
    profileContent: 'education',
    editorPanel: { kind: 'education' },
  },
  { id: 'services', label: 'Services', icon: Wrench, profileContent: 'services', editorPanel: { kind: 'services' } },
  { id: 'gallery', label: 'Gallery', icon: Camera, profileContent: 'gallery', editorPanel: { kind: 'portfolio' } },
  { id: 'videos', label: 'Videos', icon: Film, profileContent: 'videos', editorPanel: { kind: 'empty' } },
  { id: 'blog', label: 'Blog', icon: FileEdit, profileContent: 'blog', editorPanel: { kind: 'blog' } },
  { id: 'post', label: 'Post', icon: Newspaper, profileContent: 'post', editorPanel: { kind: 'blog' } },
  {
    id: 'additional',
    label: 'Additional Services',
    icon: Layers,
    profileContent: 'additional',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'explainer',
    label: '2D Explainer',
    icon: PlaySquare,
    profileContent: 'explainer',
    editorPanel: { kind: 'empty' },
  },
  { id: 'reviews', label: 'Reviews', icon: Star, profileContent: 'reviews', editorPanel: { kind: 'empty' } },
  {
    id: 'certificates',
    label: 'Certifications/Licenses',
    icon: Award,
    profileContent: 'certificates',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'insurance-license',
    label: 'Insurance License',
    icon: ShieldCheck,
    profileContent: 'insurance-license',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'licensing',
    label: 'Licensing',
    icon: BadgeCheck,
    profileContent: 'licensing',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'public-cards',
    label: 'Public Cards',
    icon: IdCard,
    profileContent: 'public-cards',
    editorPanel: { kind: 'empty' },
  },
  { id: 'clients', label: 'Clients', icon: Handshake, profileContent: 'clients', editorPanel: { kind: 'empty' } },
  {
    id: 'meet-team',
    label: 'Meet Our Team',
    icon: UsersRound,
    profileContent: 'meet-team',
    editorPanel: { kind: 'empty' },
  },
  { id: 'calendar', label: 'Calender', icon: Calendar, profileContent: 'calendar', editorPanel: { kind: 'empty' } },
  { id: 'faq', label: 'Faq', icon: Lightbulb, profileContent: 'faq', editorPanel: { kind: 'faq' } },
  {
    id: 'work',
    label: 'Work Experience',
    icon: Briefcase,
    profileContent: 'work',
    editorPanel: { kind: 'experience' },
  },
  {
    id: 'video-links',
    label: 'Video Links',
    icon: Video,
    profileContent: 'video-links',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'announcement',
    label: 'Announcement',
    icon: Megaphone,
    profileContent: 'announcement',
    editorPanel: { kind: 'empty' },
  },
  { id: 'bbb', label: 'BBB', icon: Shield, profileContent: 'bbb', editorPanel: { kind: 'empty' } },
  { id: 'booking', label: 'Booking', icon: CalendarDays, profileContent: 'booking', editorPanel: { kind: 'empty' } },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee, profileContent: 'breakfast', editorPanel: { kind: 'empty' } },
  {
    id: 'contact-us',
    label: 'Contact Us',
    icon: Phone,
    profileContent: 'about',
    editorPanel: { kind: 'personal', subTab: 2 },
  },
  { id: 'dcp', label: 'DCP', icon: FileText, profileContent: 'dcp', editorPanel: { kind: 'empty' } },
  { id: 'dinner', label: 'Dinner', icon: Utensils, profileContent: 'dinner', editorPanel: { kind: 'empty' } },
  { id: 'events', label: 'Events', icon: Ticket, profileContent: 'events', editorPanel: { kind: 'empty' } },
  { id: 'home-solar', label: 'Home Solar', icon: Sun, profileContent: 'home-solar', editorPanel: { kind: 'empty' } },
  { id: 'inventory', label: 'Inventory', icon: Package, profileContent: 'inventory', editorPanel: { kind: 'empty' } },
  {
    id: 'join-team',
    label: 'Join My Team',
    icon: UserPlus,
    profileContent: 'join-my-team',
    editorPanel: { kind: 'empty' },
  },
  { id: 'lunch', label: 'Lunch', icon: UtensilsCrossed, profileContent: 'lunch', editorPanel: { kind: 'empty' } },
  { id: 'menu', label: 'Menu', icon: Menu, profileContent: 'menu', editorPanel: { kind: 'empty' } },
  { id: 'press', label: 'Press/Media', icon: Mic, profileContent: 'media-press', editorPanel: { kind: 'empty' } },
  {
    id: 'property-listing',
    label: 'Property Listing',
    icon: Building2,
    profileContent: 'property-listing',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'resiliency',
    label: 'Resiliency Products',
    icon: ShieldCheck,
    profileContent: 'resiliency-products',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'see-product',
    label: 'See Product',
    icon: ShoppingBag,
    profileContent: 'see-products',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'sales-24h',
    label: '24/h SalesPerson',
    icon: Headphones,
    profileContent: 'sales-person',
    editorPanel: { kind: 'empty' },
  },
  {
    id: 'who-we-are',
    label: 'Who We Are',
    icon: Landmark,
    profileContent: 'why-choose-us',
    editorPanel: { kind: 'empty' },
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
  'Resume',
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

export function isNavItemVisible(settings: VCardDisplaySettings, label: string): boolean {
  if (!settings.globalEnabled) return false
  const raw = settings.fields[label]
  const config = raw
    ? normalizeFieldConfig({ ...createDefaultNavFieldConfig(label), ...raw })
    : createDefaultNavFieldConfig(label)
  return config.visible
}

export function filterNavItemsByVisibility(items: NavBarNavItem[], settings: VCardDisplaySettings): NavBarNavItem[] {
  return items.filter((item) => isNavItemVisible(settings, item.label))
}

export function getNavItemBackgroundColor(settings: VCardDisplaySettings, label: string): string | undefined {
  const bg = settings.fields[label]?.backgroundColor?.trim()
  return bg || undefined
}

export function getNavItemById(id: string, items: NavBarNavItem[] = NAV_BAR_NAV_ITEMS): NavBarNavItem | undefined {
  return items.find((item) => item.id === id)
}

export function getNavDisplayLabel(item: NavBarNavItem): string {
  return item.displayLabel ?? item.label
}
