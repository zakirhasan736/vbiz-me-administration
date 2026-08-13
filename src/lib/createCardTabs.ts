import {
  BadgeCheck,
  Briefcase,
  Contact,
  FileText,
  Globe2,
  GraduationCap,
  IdCard,
  Image as ImageIcon,
  Images,
  Layers,
  MessageSquareQuote,
  Newspaper,
  Star,
  User,
  type LucideIcon,
} from 'lucide-react'

export type CreateCardTabName = string

export type CreateCardTabDef = {
  name: CreateCardTabName
  /** Admin editor section id used in URL routes */
  navId: string
  icon: LucideIcon
  description: string
  pinEnd?: boolean
  /** AI should try to extract content for this tab when sources support it */
  aiPriority?: 'core' | 'content' | 'optional'
}

export const ALWAYS_ENABLED_NAV_IDS = ['home', 'about', 'global-connection', 'my-info'] as const

/** Default utility tabs shown at the end on new cards. Users can reorder them later. */
export const PINNED_END_NAV_IDS = ['global-connection', 'my-info'] as const

/** Backoffice DEFAULT_ENABLED_TABS order — used for tour activateTab + manual create defaults. */
export const CREATE_CARD_DEFAULT_TABS: CreateCardTabDef[] = [
  {
    name: 'Personal',
    navId: 'home',
    icon: User,
    description: 'Profile, contact details, media & socials',
    aiPriority: 'core',
  },
  {
    name: 'Education',
    navId: 'education',
    icon: GraduationCap,
    description: 'Degrees, schools, and years',
    aiPriority: 'content',
  },
  {
    name: 'Experience',
    navId: 'work',
    icon: Briefcase,
    description: 'Work history and roles',
    aiPriority: 'content',
  },
  { name: 'Skill', navId: 'skills', icon: Star, description: 'Skill groups and proficiency', aiPriority: 'content' },
  {
    name: 'Services',
    navId: 'services',
    icon: Layers,
    description: 'Offerings, pricing, and delivery',
    aiPriority: 'content',
  },
  {
    name: 'Reviews',
    navId: 'reviews',
    icon: MessageSquareQuote,
    description: 'Guest & client reviews',
    aiPriority: 'content',
  },
  {
    name: 'News/Blogs',
    navId: 'blog',
    icon: Newspaper,
    description: 'Articles, news, and blog posts',
    aiPriority: 'content',
  },
  {
    name: 'Profile',
    navId: 'profile',
    icon: IdCard,
    description: 'Public profile headline, bio & photo',
    aiPriority: 'content',
  },
  {
    name: 'Portfolio',
    navId: 'gallery',
    icon: ImageIcon,
    description: 'Projects and case studies',
    aiPriority: 'content',
  },
  {
    name: 'FAQ',
    navId: 'faq',
    icon: MessageSquareQuote,
    description: 'Common questions and answers',
    aiPriority: 'content',
  },
  {
    name: 'Certifications/Licenses',
    navId: 'certificates',
    icon: BadgeCheck,
    description: 'Credentials & licenses with documents',
    aiPriority: 'content',
  },
  {
    name: 'Resume',
    navId: 'resume',
    icon: FileText,
    description: 'Resume / CV document upload',
    aiPriority: 'optional',
  },
  {
    name: 'Content & media',
    navId: 'content-media',
    icon: Images,
    description: 'Gallery, videos, and media library',
    aiPriority: 'optional',
  },
  {
    name: 'Global Connection',
    navId: 'global-connection',
    icon: Globe2,
    description: 'Shared global contact directory (same list for all cards)',
    pinEnd: true,
  },
  {
    name: 'My Info',
    navId: 'my-info',
    icon: Contact,
    description: 'Call / text / email actions from personal info',
    pinEnd: true,
  },
]

export const CREATE_CARD_TAB_BY_NAME = Object.fromEntries(CREATE_CARD_DEFAULT_TABS.map((t) => [t.name, t])) as Record<
  string,
  CreateCardTabDef
>

export const CREATE_CARD_TAB_BY_NAV_ID = Object.fromEntries(
  CREATE_CARD_DEFAULT_TABS.map((t) => [t.navId, t])
) as Record<string, CreateCardTabDef>

export function resolveCreateCardTabName(tab: string): CreateCardTabDef | undefined {
  if (CREATE_CARD_TAB_BY_NAME[tab]) return CREATE_CARD_TAB_BY_NAME[tab]
  return CREATE_CARD_TAB_BY_NAV_ID[tab]
}

export function createCardTabNameToNavId(tab: string): string | null {
  return resolveCreateCardTabName(tab)?.navId ?? null
}

export function getCreateCardDisplayLabel(navId: string, fallback: string): string {
  return CREATE_CARD_TAB_BY_NAV_ID[navId]?.name ?? fallback
}

/** Full default set for manual create. */
export function getDefaultCreateCardNavIds(): string[] {
  return CREATE_CARD_DEFAULT_TABS.map((t) => t.navId)
}

/**
 * Minimal seed for AI create: Personal + pinned end tabs only.
 * Extra tabs come only from AI suggestions / extracted content.
 */
export function getAiSeedCreateCardNavIds(): string[] {
  return ['home', 'about', ...PINNED_END_NAV_IDS]
}

/** Tabs AI should try to fill when source data exists. */
export function getAiContentCandidateNavIds(): string[] {
  return CREATE_CARD_DEFAULT_TABS.filter((t) => t.aiPriority === 'core' || t.aiPriority === 'content').map(
    (t) => t.navId
  )
}

/**
 * Keep pinned utility tabs at the end while preserving their user-chosen order
 * when one is supplied. Defaults remain Global Connection -> My Info.
 */
export function normalizeNavOrderWithPinnedEnds(navIds: string[]): string[] {
  const pinned = new Set<string>(PINNED_END_NAV_IDS)
  const middle = navIds.filter((id) => id && id !== 'home' && id !== 'about' && !pinned.has(id))
  const uniqueMiddle = Array.from(new Set(middle))
  const pinnedOrder = Array.from(new Set([...navIds.filter((id) => pinned.has(id)), ...PINNED_END_NAV_IDS]))
  return ['home', 'about', ...uniqueMiddle, ...pinnedOrder]
}

/** Keep required tabs enabled while preserving the exact user-selected order. */
export function normalizeNavOrderWithRequiredTabs(navIds: string[]): string[] {
  const required = new Set<string>(ALWAYS_ENABLED_NAV_IDS)
  const unique = Array.from(new Set(navIds.filter((id) => typeof id === 'string' && id.trim())))
  const next = [...unique]
  if (!next.includes('home')) next.unshift('home')
  if (!next.includes('about')) {
    const homeIndex = next.indexOf('home')
    next.splice(homeIndex >= 0 ? homeIndex + 1 : 1, 0, 'about')
  }
  for (const id of ['global-connection', 'my-info']) {
    if (!next.includes(id)) next.push(id)
  }
  return next.filter((id) => id && (required.has(id) || unique.includes(id)))
}

/** Human-readable catalog for AI prompts / chat. */
export function getCardTabCatalogForAi(): string {
  return CREATE_CARD_DEFAULT_TABS.map((t) => {
    const pin = t.pinEnd ? ' [ALWAYS LAST — do not remove]' : ''
    const prio = t.aiPriority ? ` (AI ${t.aiPriority})` : ''
    return `- ${t.name} (navId=${t.navId})${prio}${pin}: ${t.description}`
  }).join('\n')
}
